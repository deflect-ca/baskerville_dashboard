# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
import os
import traceback
import uuid

import eventlet
import redis
from redis import Redis
from pyaml_env import parse_config

eventlet.monkey_patch()

from baskerville_dashboard.auth import Auth
from baskerville_dashboard.db.manager import SessionManager
from baskerville.util.enums import UserCategoryEnum
from baskerville_dashboard.utils.kafka import consume_from_kafka

import atexit

from baskerville.db import set_up_db
from baskerville.util.helpers import get_logger
from baskerville_dashboard.utils.helpers import get_default_conf_path, \
    get_active_processes, response_jsonified, ResponseEnvelope
from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_session import Session

HOST = 'http://127.0.0.1:5000'
client = None
SESSION_TYPE = 'redis'
SECRET_KEY = 'secret'
engine = None
limiter = None
logger = get_logger(__name__)
ACTIVE_APPS = {}
KAFKA_CONSUMER_THREAD = None
REDIS_HOST = os.environ.get('REDIS_HOST', '0.0.0.0')
REDIS_PASS = os.environ.get('REDIS_PASS', '')
if REDIS_PASS:
    REDIS_PASS = f':{REDIS_PASS}@'
REDIS_URL = f'redis://{REDIS_PASS}{REDIS_HOST}:6379'


def import_db_models():
    # first import baskerville main models, then the dashboard models, because
    # of cyclic reference
    from baskerville.db.models import (
        Runtime, RequestSet, Model, ModelTrainingSetLink, Attack, Attribute,
        BanjaxBan, RequestSetAttackLink, AttributeAttackLink
    )
    from baskerville.db.dashboard_models import (
        User, UserCategory, FeedbackContext, Feedback
    )


def handle_error(error, status_code):
    resp = jsonify(error)
    resp.status_code = status_code
    return resp


def add_org(session, baskerville_config):
    from baskerville.db.dashboard_models import Organization
    new_org = False
    org = None
    uuid = baskerville_config['user_details']['organization_uuid']
    name = baskerville_config['user_details']['organization_name']
    try:
        # todo use a validated BaskervilleConfig to avoid errors
        org = session.query(Organization).filter_by(uuid=uuid).first()
        if not org:
            org = Organization()
            new_org = True
        org.uuid = uuid
        org.name = name
        org.registered = org.registered or False
        if new_org:
            session.add(org)
        session.commit()
    except Exception:
        session.rollback()
        traceback.print_exc()
    return org


def add_guest_org(session):
    from baskerville.db.dashboard_models import Organization
    new_org = False
    org = None
    org_uuid = uuid.uuid4()
    name = 'Guest Org.'
    try:
        # todo use a validated BaskervilleConfig to avoid errors
        org = session.query(Organization).filter_by(name=name).first()
        if not org:
            org = Organization()
            new_org = True
        org.uuid = org.uuid if not new_org else org_uuid
        org.name = name
        org.registered = org.registered or False
        if new_org:
            session.add(org)
        session.commit()
    except Exception:
        session.rollback()
        traceback.print_exc()
    return org


def add_admin_user(config, session, baskerville_config):
    from baskerville.db.dashboard_models import User, UserCategory
    email = config.get('ADMIN_EMAIL')
    org = add_org(session, baskerville_config)
    category = session.query(UserCategory).filter_by(
            category=str(UserCategoryEnum.admin)
        ).first()
    new_admin = False
    try:
        admin = session.query(User).filter_by(email=email).first()
        if not admin:
            admin = User()
            new_admin = True
        admin.username = 'admin'
        admin.email = config.get('ADMIN_EMAIL')
        admin.password_hash = admin.hash_password(config.get('ADMIN_PASS'))
        admin.is_active = True
        admin.is_admin = True
        admin.id_organization = admin.id_organization or org.id
        admin.organization = org
        admin.id_category = category.id
        admin.category = category
        if new_admin:
            session.add(admin)
        session.commit()
    except Exception:
        session.rollback()
        traceback.print_exc()


def add_extra_users(config, session):
    from baskerville.db.dashboard_models import User, UserCategory, Organization
    org = session.query(Organization).filter_by(name='Guest Org.').first()
    category = session.query(UserCategory).filter_by(
            category=str(UserCategoryEnum.user)
        ).first()
    new_user = False
    try:
        for u in config.get('USERS'):
            print(u)
            user = session.query(User).filter_by(username=u['username']).first()
            if not user:
                user = User()
                new_user = True
            user.username = u['username']
            user.email = u.get('email', f'{user.username}@email')
            user.password_hash = user.hash_password(u['password'])
            user.is_active = True
            user.is_admin = False
            user.id_organization = user.id_organization or org.id
            user.organization = org
            user.id_category = category.id
            user.category = category
            if new_user:
                session.add(user)
            session.commit()
    except Exception:
        session.rollback()
        traceback.print_exc()


def add_user_categories(session):
    from baskerville.db.dashboard_models import UserCategory
    for attr in dir(UserCategoryEnum):
        if '__' not in attr:
            category = str(getattr(UserCategoryEnum, attr))
            existing_cat = session.query(UserCategory).filter_by(
                category=category).first()
            if not existing_cat:
                user_category = UserCategory(category=category)
                session.add(user_category)
    session.commit()


def add_start_up_data(config, baskerville_config):
    sm = SessionManager()
    session = sm.session
    add_user_categories(session)
    add_guest_org(session)
    add_admin_user(config, session, baskerville_config)


def set_up_kafka_thread(app_config, baskerville_config):
    """
    Start a thread to handle incoming messages from Baskerville
    :param app_config:
    :param baskerville_config:
    :return:
    """
    global KAFKA_CONSUMER_THREAD
    import threading
    KAFKA_CONSUMER_THREAD = threading.Thread(
        target=consume_from_kafka,
        args=(app_config, baskerville_config,),
        daemon=True
    )
    KAFKA_CONSUMER_THREAD.start()


def create_app(config=None, environment=None):
    global jwtApp, SECRET_KEY
    from baskerville_dashboard.db.manager import SessionManager
    from baskerville.util.helpers import parse_config

    url_prefix = config['APP_CONFIG']['PREFIX']
    SECRET_KEY = config['APP_CONFIG']['SECRET_KEY']

    app = Flask(__name__)
    app.config.update(config['APP_CONFIG'] or {})
    app.config.update({'SECRET_KEY': SECRET_KEY, 'SESSION_TYPE': SESSION_TYPE})

    baskerville_conf = parse_config(app.config['BASKERVILLE_CONF'])
    import_db_models()
    Session, engine = set_up_db(baskerville_conf.get('database'), create=True)
    sm = SessionManager()
    sm.set_session(Session)
    sm.set_engine(engine)
    app_config = config.get('APP_CONFIG')
    app.config['SESSION_REDIS'] = redis.from_url(REDIS_URL)
    add_start_up_data(app_config, baskerville_conf)
    set_up_kafka_thread(app_config, baskerville_conf)
    add_extra_users(config, sm.session)

    from baskerville_dashboard.routes.feedback import feedback_app
    from baskerville_dashboard.routes.stats import stats_app
    from baskerville_dashboard.routes.try_baskerville import try_baskerville_app
    from baskerville_dashboard.routes.results import results_app
    from baskerville_dashboard.routes.user import user_app
    from baskerville_dashboard.routes.pipeline_management import pipeline_management_app
    from baskerville_dashboard.routes.components import components_app
    from baskerville_dashboard.routes.retrain import retrain_app
    from baskerville_dashboard.routes.messages import messages_app

    app.register_blueprint(feedback_app, url_prefix=url_prefix)
    app.register_blueprint(stats_app, url_prefix=url_prefix)
    app.register_blueprint(try_baskerville_app, url_prefix=url_prefix)
    app.register_blueprint(results_app, url_prefix=url_prefix)
    app.register_blueprint(user_app, url_prefix=url_prefix)
    app.register_blueprint(pipeline_management_app, url_prefix=url_prefix)
    app.register_blueprint(components_app, url_prefix=url_prefix)
    app.register_blueprint(retrain_app, url_prefix=url_prefix)
    app.register_blueprint(messages_app, url_prefix=url_prefix)

    return app


app = create_app(parse_config('../conf/config.yaml'))
Session(app)
CORS(
    app,
    allow_headers=[
        "Content-Type", "Authorization", "Access-Control-Allow-Credentials"
    ],
    supports_credentials=True
)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    message_queue=REDIS_URL,
    async_mode='eventlet', logger=True, engineio_logger=True
)


def identity():
    return Auth().post()


@app.route('/')
def version():
    return 'Baskerville-dashboard v0.0.1'


@app.route('/api/1/status')
def status():
    return response_jsonified(ResponseEnvelope(True), 200)


@socketio.on('echo')
def echo(message):
    emit('echo', message)


@socketio.on('register')
def register(id):

    @socketio.on(id)
    def reply(message):
        print('GOT MESSAGE:', message)
        # emit(id, message)

    emit('message', f'Registered: {id}')
    emit(id, f'Registered: {id}')


@socketio.on('app-status')
def app_status(app_id):
    # config = ACTIVE_APPS[app_id]._args[0]
    # for line in follow_file(config['engine']['logpath']):
    #     print(line)
    #     emit(line, app_id)
    pass


@app.after_request
def after_request(response):
    # todo: specify origin
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
    return response


@atexit.register
def clean_up_before_shutdown():
    global g, logger

    if not logger:
        from baskerville.util.helpers import get_logger
        logger = get_logger('clean_up_before_shutdown')

    logger.info('Just a sec, finishing up...')
    try:

        for k, v in get_active_processes():
            print('Stopping ', k)
            v.terminate()
            v.join()
    except:
        pass


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, use_reloader=False)
