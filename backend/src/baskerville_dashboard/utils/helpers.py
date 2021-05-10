# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
from concurrent.futures import Future
from datetime import datetime

import eventlet
import psutil
from baskerville.db.models import Runtime, RequestSet
from baskerville_dashboard.vm.retrain_vm import RetrainVm

eventlet.monkey_patch()
import json
import re

from baskerville_dashboard.utils.kafka import get_kafka_producer
from docker.errors import DockerException

from baskerville.db.dashboard_models import User, Organization, Feedback
from baskerville.models.config import KafkaConfig
from baskerville.util.enums import FeedbackEnum
from baskerville_dashboard.vm.feedback_vm import FeedbackVM
from docker.models.containers import Container
from kafka.errors import NoBrokersAvailable

import os
import traceback
from dateutil import parser
from math import ceil
from functools import wraps
from threading import Thread, Event

import docker
from flask import abort
from baskerville_dashboard.db.manager import SessionManager
from baskerville.util.helpers import parse_config, SerializableMixin, \
    get_logger
from baskerville.util.enums import LabelEnum


KAFKA_PRODUCER = None
KAFKA_CONSUMER = None

ALLOWED_EXTENSIONS = {'json', 'zip', 'gzip', 'tar'}
COMPRESSION_EXTENSIONS = {'zip', 'gzip', 'tar'}
REVERSE_LABELS = {e.name: e.value for e in LabelEnum}
ALLOWED_COLS = [
    'id', 'ip', 'uuid_request_set', 'target', 'target_original', 'start',
    'stop',
    'num_requests', 'prediction', 'score', 'low_rate_attack'
]
FILTER = {
    'page': 0,
    'size': 50,
    'start': '',
    'stop': '',
    'prediction': '',
    'ip': '',
    'target': '',
    # 'app_id': None,
}
DATE_FIELDS = {'start', 'stop'}
FILTER_TO_DT = {
    'page': int,
    'size': int,
    'start': str,
    'stop': str,
    'prediction': str,
    'ip': str,
    'target': str,
    # 'app_id': str,
}
BOT_NOT_BOT = {
    'bot': {
        LabelEnum.malicious.value: FeedbackEnum.correct,
        LabelEnum.benign.value: FeedbackEnum.incorrect,
        LabelEnum.unknown.value: FeedbackEnum.bot
    },
    'notbot': {
        LabelEnum.malicious.value: FeedbackEnum.incorrect,
        LabelEnum.benign.value: FeedbackEnum.correct,
        LabelEnum.unknown.value: FeedbackEnum.not_bot
    },
}
ALLOWED_FEEDBACK = {'bot', 'notbot'}
DOCKER_CLIENT = None
camel_case_pattern = re.compile(r'(?<!^)(?=[A-Z])')

logger = get_logger(__name__, output_file='baskerville_dashboard.log')


def get_docker_client():
    global DOCKER_CLIENT
    if not DOCKER_CLIENT:
        try:
            DOCKER_CLIENT = docker.DockerClient()
        except DockerException:
            print('Could not get DOCKER CLIENT')
    return DOCKER_CLIENT


def get_feedback_from_bot_not_bot(rs, bot_not_bot):
    return BOT_NOT_BOT[bot_not_bot][rs.prediction]


def get_default_data_path():
    """
    Returns the absolute path to the data folder
    :return:
    """
    return f'{os.path.dirname(os.path.realpath(__file__))}/../../../data'


def get_default_conf_path():
    """
    Returns the absolute path to the conf folder
    :return:
    """
    return f'{os.path.dirname(os.path.realpath(__file__))}/../../../conf'


def get_baskerville_config_path():
    from flask import current_app
    return current_app.config.get('BASKERVILLE_CONF')
    # br = os.environ.get('BASKERVILLE_ROOT')
    # if br:
    #     return os.path.join(br, 'conf', 'baskerville_conf.yaml')
    # return os.path.join(get_default_conf_path(), 'baskerville_conf.yaml')


def get_training_config_path():
    return os.path.join(get_default_data_path(), 'training_config.sample.yaml')


def get_current_baskerville_config():
    return parse_config(
        get_baskerville_config_path()
    )


def register_org(org_uuid, baskerville_host):
    from baskerville.models.config import KafkaConfig
    kafka_config = KafkaConfig(
        get_current_baskerville_config().get('kafka')
    ).validate()
    kafka_config['bootstrap_servers'] = baskerville_host
    publisher = get_kafka_producer(kafka_config)
    publisher.send(kafka_config['register_topic'], org_uuid)
    publisher.flush()


def submit_feedback_vm(feedback_vm: FeedbackVM):
    from kafka.errors import KafkaError
    try:
        kafka_config = KafkaConfig(
            get_current_baskerville_config().get('kafka')
        ).validate()
        publisher = get_kafka_producer(kafka_config)
        publisher.send(
            kafka_config['feedback_topic'],
            bytes(
                json.dumps(feedback_vm.to_dict(), default=str).encode('utf-8'))
        )
        publisher.send(
            kafka_config['feedback_response_topic'],
            bytes(json.dumps({
                'uuid_organization': feedback_vm.feedback[0].uuid_organization,
                'id_context': feedback_vm.feedback_context.id,
                'success': True
            }
            ).encode('utf-8'))
        )
        publisher.flush()
        return True
    except KafkaError as ke:
        traceback.print_exc()
        if isinstance(ke, NoBrokersAvailable):
            raise ke
    except Exception:
        traceback.print_exc()
        return False
    return True


def submit_feedback_one_by_one(feedback_list):
    try:
        kafka_config = get_current_baskerville_config().get('kafka')
        publisher = get_kafka_producer(kafka_config)
        for feedback in feedback_list:
            publisher.send(
                kafka_config['feedback_topic'],
                feedback.to_dict(exclude=('ip', 'target'))
            )
        publisher.flush()
    except Exception:
        traceback.print_exc()
        return False
    return True


def submit_training(retrain_vm: RetrainVm, retrain_topic='retrain'):
    from kafka.errors import KafkaError
    try:
        kafka_config = KafkaConfig(
            get_current_baskerville_config().get('kafka')
        ).validate()
        publisher = get_kafka_producer(kafka_config)
        publisher.send(
            retrain_topic,
            bytes(
                json.dumps(
                    retrain_vm.to_dict(), default=str
                ).encode('utf-8')
            )
        )
        publisher.flush()
        return True
    except KafkaError as ke:
        traceback.print_exc()
        if isinstance(ke, NoBrokersAvailable):
            raise ke
    except Exception:
        traceback.print_exc()
        return False
    return True


def follow_file(file_path, timeout=150):
    not_line = 0
    with open(file_path) as f:
        import time
        f.seek(0, 2)  # Go to the end of the file
        while True:
            line = f.readline()
            if not line:
                if not_line > timeout:
                    break
                not_line += 1
                time.sleep(1)  # Sleep briefly
                continue
            not_line = 0
            yield line


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def response_jsonified(em, resp_code=None):
    from flask import jsonify
    if not resp_code:
        resp_code = 200
    if not em.success:
        if resp_code == 200:
            raise ValueError(
                'Action was not successful and response code is 200'
            )
        if not resp_code:
            resp_code = 500
    return jsonify(em.to_dict()), resp_code


def validate_config(config):
    from baskerville.models.config import BaskervilleConfig

    bc = BaskervilleConfig(config)
    try:
        bc.validate()
    except ValueError:
        traceback.print_exc()
        return bc.serialized_errors
    return None


def unzip(file, to):
    import zipfile
    with zipfile.ZipFile(file, 'r') as zip_ref:
        zip_ref.extractall(to)


def get_active_apps():
    from flask import g
    if hasattr(g, 'ACTIVE_APPS'):
        return {k: v.details for k, v in g.ACTIVE_APPS.items()}
    return {}


def get_active_processes():
    from baskerville_dashboard.app import ACTIVE_APPS
    if ACTIVE_APPS:
        return {k: v.p for k, v in ACTIVE_APPS.items()}
    return {}


def get_active_app(app_id):
    """
    Returns the active app data if the id exists in active apps,
    else None
    :param app_id:
    :return:
    """
    from baskerville_dashboard.app import ACTIVE_APPS
    return ACTIVE_APPS.get(app_id, None)


def init_active_apps(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        from flask import g
        if not hasattr(g, 'ACTIVE_APPS'):
            g.ACTIVE_APPS = {}
        return f(*args, **kwargs)

    return wrapper


def start_local_baskerville(config, pipeline, **kwargs):
    # global logger
    # import os
    from baskerville.models.engine import BaskervilleAnalyticsEngine
    # from baskerville.main import add_model_to_database

    baskerville_engine = None
    try:
        for k, v in kwargs.items():
            os.environ[k] = f'{v}'
        baskerville_engine = BaskervilleAnalyticsEngine(
            pipeline,
            config
        )

        # add_model_to_database(config['database'])
        baskerville_engine.run()
    except Exception as e:
        traceback.print_exc()
    finally:
        if baskerville_engine:
            print('Exiting....')
            baskerville_engine.finish_up()
            print('Finished....')
    import sys
    sys.exit(0)


def get_baskerville_config():
    return parse_config(path=get_baskerville_config_path())


def get_socket_io():
    from flask_socketio import SocketIO
    from baskerville_dashboard.app import REDIS_URL
    try:
        return SocketIO(
            message_queue=REDIS_URL,
            async_mode='threading'
        )
    except Exception:
        traceback.print_exc()
        return SocketIO(
            message_queue=REDIS_URL,
            async_mode='eventlet'
        )


class ReadLogs(Thread):
    def __init__(self, user_channel, full_path):
        self.user_channel = user_channel
        self.full_path = full_path
        self.socketio = get_socket_io()
        self._stop_event = Event()
        super(ReadLogs, self).__init__()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    def follow(self):
        import time
        line = '-- waiting...'
        while not os.path.exists(self.full_path):
            self.socketio.emit(self.user_channel, line)
            time.sleep(1)
        for line in follow_file(self.full_path, timeout=300):
            self.socketio.emit(self.user_channel, line)

        self.socketio.emit(self.user_channel, '--end--')
        self.socketio.emit('message', '--end--')

    def run(self):
        self.follow()


def is_process_running(p):
    if isinstance(p, Future):
        return p.running()
    else:
        if hasattr(p, 'is_alive'):
            return p.is_alive()
        if hasattr(p, 'name'):
            name = p.name
            for proc in psutil.process_iter():
                print(proc.name())
                if proc.name() == name:
                    print("have")
                    return True
                else:
                    print("Dont have")
        # else:
        #     p = psutil.Process(pid)
    print('No process info...')
    return False


def process_details(app_data):
    details = app_data['details']
    details['running'] = is_process_running(app_data['process'])
    return details


class ResponseEnvelope(SerializableMixin):
    """
    Basic Structure for messages between front-end and back-end,
    in order to envelope errors and give details about what happened
    """

    def __init__(self, success=True, message="", data=None):
        self.success = success
        self.message = message
        self.data = data

    def to_dict(self, cols=()):
        dtypes = str, int, bool, float, dict, list, tuple
        self_dict = {c: getattr(self, c) for c in dir(self)
                     if not c.startswith('_') and not c.startswith("to_dict")}
        if self.data:
            if isinstance(self.data, (list, tuple, set)):
                self_dict['data'] = []
                for each in self.data:
                    if hasattr(each, 'to_dict'):
                        self_dict['data'].append(each.to_dict())
                    elif isinstance(each, dtypes):
                        self_dict['data'].append(each)
                    else:
                        print('Do not know what to do with: ', each)
                # self_dict['data'] = [each.to_dict() for each in self.data]
            elif issubclass(self.data.__class__, (SerializableMixin)):
                self_dict['data'] = self.data.to_dict()
        return self_dict


class SerializableContainer(Container, SerializableMixin):
    _allowed_pops = {
        'name', 'status'
    }

    def get_service_name(self):
        return self.attrs['Config']['Labels'].get(
            'com.docker.compose.service', {}
        )

    def get_status_details(self):
        return self.attrs['State']

    def to_dict(self, cols=()):
        d = {
            'service_name': self.get_service_name(),
            'state_details': self.get_status_details()
        }
        d.update({
            c: getattr(self, c) for c in dir(self)
            if c in self._allowed_pops
        })
        return d


def get_user_runtimes(user: User):
    sm = SessionManager()
    runtimes = sm.session.query(Runtime).filter(
        Runtime.id_user == user.id
    ).all()
    return runtimes


def get_rss(
        ip, target, start, stop, prediction, size, page,
        id_runtime=None, user=None, ip_list=None, id_feedback_context=None
):
    sm = SessionManager()
    rs_q = sm.session.query(
        *[RequestSet.__dict__[c] for c in ALLOWED_COLS]
    )
    if id_runtime:
        rs_q = rs_q.filter(RequestSet.id_runtime == id_runtime)
    if not id_runtime and not user.is_admin:
        logger.debug(f'Filtering runtimes for user.id:{user.id}')
        # admins can see everything, for everyone else, filter
        runtime_ids = [r.id for r in get_user_runtimes(user)]
        logger.debug(f'Runtime ids: {runtime_ids}')
        rs_q = rs_q.filter(RequestSet.id_runtime.in_(runtime_ids))
    if ip:
        rs_q = rs_q.filter(RequestSet.ip == ip)
    if ip_list:
        rs_q = rs_q.filter(RequestSet.ip.in_(ip_list))
    if target:
        rs_q = rs_q.filter(RequestSet.target == target)
    if start:
        rs_q = rs_q.filter(RequestSet.start >= start)
    if stop:
        rs_q = rs_q.filter(RequestSet.stop <= stop)
    if prediction:
        if prediction not in REVERSE_LABELS:
            abort(404)
        rs_q = rs_q.filter(RequestSet.prediction == REVERSE_LABELS[prediction])
    count_rss = rs_q.count()
    rs_q = rs_q.limit(size).offset(page * size)
    total_num_pages = ceil(count_rss / size) if count_rss > 0 else 0
    data = rs_q.all()
    if data:
        data_dict = [{
            k: v for k, v in zip(ALLOWED_COLS, r)
        } for r in data]
        # todo: join
        feedback = sm.session.query(Feedback)
        if id_feedback_context:
            feedback = feedback.filter(
                Feedback.id_feedback_context == id_feedback_context
            )
        feedback.filter(
            Feedback.id_user == user.id
        ).filter(
            Feedback.uuid_request_set.in_(
                [d[ALLOWED_COLS.index('uuid_request_set')] for d in data])
        ).all()
        feedback_to_rs = {
            f.uuid_request_set: (f.feedback, f.low_rate)
            for f in feedback
        }

        if feedback_to_rs:
            for rs in data_dict:
                fb, lr = feedback_to_rs.get(rs['uuid_request_set'], (None, 0))
                rs['feedback'] = str(fb)
                rs['low_rate_feedback'] = lr

        # todo: model:
        return {
            'data': data_dict,
            'num_pages': total_num_pages,
            'num_results': count_rss,
            'current_page': page,
            'page_size': size,
        }
    return {
        'data': [],
        'num_pages': 0,
    }


def get_path_to_uploaded_file(file_name, client_uuid):
    import os
    from flask import current_app
    return os.path.join(
        current_app.config['UPLOAD_FOLDER'], client_uuid, file_name
    )


def get_ip_list(file_name, client_uuid):
    data = []
    # todo: support other formats
    import csv
    full_path = get_path_to_uploaded_file(file_name, client_uuid)
    headers_passed = False

    with open(full_path, newline='') as f:
        for row in csv.reader(f):
            if headers_passed:
                data.append(str(row[0]))
            headers_passed = True
    return data


def get_qparams(request):
    _q_filter = FILTER.copy()
    for k, v in _q_filter.items():
        obj = request.args.get(k, default=v, type=FILTER_TO_DT[k])
        _q_filter[k] = obj
    for field in DATE_FIELDS:
        if field in _q_filter and _q_filter[field]:
            # todo: proper time from ui
            p = parser.parse(_q_filter[field])
            _q_filter[field] = f'{p.month}/{p.day}/{p.year} 00:00:00'
    return _q_filter


def get_extension(file_path: str):
    """
    Returns a file's extension if any, else None
    :param str file_path:
    :return:
    """
    split = file_path.rsplit('.', 1)
    return split[1] if len(split) > 1 else None


def is_compressed(file_path: str):
    """
    Returns True if the file path matches any of the allowed extensions
    :param str file_path: full path to file
    :return: True if
    """
    ext = get_extension(file_path)
    if not ext:
        return False
    return any(
        True
        for ext in COMPRESSION_EXTENSIONS
        if file_path[len(file_path) - len(ext):] == ext
    )


def get_docker_ps():
    ps = [SerializableContainer(**c.__dict__) for c in
          get_docker_client().containers.list(all=True)]
    return ps


def get_docker_container_status(container_name):
    container = get_docker_client().containers.get(container_name)
    container_state = container.attrs['State']
    return container_state['Status']


def get_user_by_org_uuid(org_uuid, user_id) -> User:
    from flask import session
    sm = SessionManager()
    org_uuid = org_uuid or session.get('user_uuid')
    if org_uuid:
        org = sm.session.query(Organization).filter_by(
            uuid=org_uuid).first()
        if org:
            user = sm.session.query(User).filter_by(
                id=user_id
            ).filter_by(
                id_organization=org.id
            ).first()
            logger.debug(f'User: {user.username} {user.id}')
            return user
    return None


def convert_dict_to_snake_case(d):
    o = {}
    for k, v in d.items():
        if isinstance(v, dict):
            o[camel_case_to_snake_case(k)] = convert_dict_to_snake_case(v)
        else:
            o[camel_case_to_snake_case(k)] = v
    return o


def camel_case_to_snake_case(w):
    """
    Convert CameCase to snake_case
    :param str w:
    :return:
    """
    return camel_case_pattern.sub('_', w).lower()


if __name__ == '__main__':
    # errors = check_license('./../../../src')
    # print(errors)
    print(is_compressed('7de85a71-2f08-4abf-a7eb-521547c69e40_test.json.zip'))
