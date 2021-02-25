import traceback

from baskerville.db.dashboard_models import User, Organization, UserCategory
from baskerville_dash.auth import Auth, SignUpGuest, SignUp, \
    admin_login_required
from baskerville_dash.db.manager import SessionManager
from baskerville_dash.utils.enums import UserCategoryEnum
from baskerville_dash.utils.helpers import ResponseEnvelope, \
    response_jsonified, register_org
from flask import Blueprint, request

user_app = Blueprint('user_app', __name__)


@user_app.route('/login', methods=('POST',))
def login():
    return Auth().post()


@user_app.route('/login/guest', methods=('POST',))
def guest_login():
    print('Registering guest...')
    return SignUpGuest().post()


@user_app.route('/register', methods=('POST',))
def register():
    return SignUp().post()


@user_app.route('/organization/register', methods=('POST',))
def register_organization():
    sm = SessionManager()
    re = ResponseEnvelope()
    code = 200
    try:
        data = request.get_json()['data']
        print('>>> DATA:', data)
        org = sm.session.query(Organization).filter_by(uuid=data['orgUUID']).first()
        if not org:
            # org to be registered should be in db
            re.success = False
            re.message = 'Could not find org.'
            re.data = None
            code = 404
        register_org(org.uuid, data['baskervilleHost'])
        re.success = True
        re.message = 'All users'
    except Exception as e:
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        re.data = None
        code = 500
    return response_jsonified(re, code)


@user_app.route('/users', methods=('GET',))
@admin_login_required
def get_all_users():
    sm = SessionManager()
    re = ResponseEnvelope()
    try:
        users = sm.session.query(User).all()
        re.data = [u.to_dict() for u in users]
        re.success = True
        re.message = 'All users'
    except Exception as e:
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        re.data = []
    return response_jsonified(re)


@user_app.route('/users/<id>', methods=('POST',))
@admin_login_required
def get_user(id):
    sm = SessionManager()
    re = ResponseEnvelope()
    code = 200
    try:
        user = sm.session.query(User).filter_by(id=id).first()
        if not user:
            re.success = False
            re.message = 'Could not find user.'
            re.data = None
        else:
            re.data = user.to_dict()
            re.success = True
            re.message = f'User #{user.id}'
    except Exception as e:
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        re.data = []
    return response_jsonified(re, code)


@user_app.route('/users', methods=('POST',))
@admin_login_required
def create_user():
    sm = SessionManager()
    re = ResponseEnvelope()
    data = request.get_json()
    code = 200
    try:
        org = sm.session.query(Organization).filter_by(
            uuid = data['uuid_organization']
        ).first()
        category = sm.session.query(UserCategory).filter_by(
            category=UserCategoryEnum[data['category']]
        ).first()
        if not org:
            re.success = False
            re.message = 'Could not find organization'
            re.data = None
            code = 403
        if not category:
            re.success = False
            re.message = 'Could not find category'
            re.data = None
            code = 403
        else:
            user = User()
            user.id_organization = org.id
            user.id_category = category.id
            user.username = data['username']
            user.password_hash = user.hash_password(data['password'])
            user.first_name = data.get('first_name')
            user.last_name = data.get('last_name')
            user.email = data.get('email')
            user.is_active = data.get('is_active')
            user.is_admin = data.get('is_active')
            sm.session.add(user)
            sm.session.commit()
            re.data = user.to_dict()
            re.success = True
            re.message = f'User #{user.id} successfully created.'
    except Exception as e:
        sm.session.rollback()
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        re.data = []
        code = 500
    return response_jsonified(re, code)


@user_app.route('/users/<id>', methods=('PUT',))
@admin_login_required
def update_user(id):
    sm = SessionManager()
    re = ResponseEnvelope()
    data = request.get_json()
    code = 200
    try:
        user = sm.session.query(User).filter_by(id=id).first()
        if not user:
            re.success = False
            re.message = 'Could not find user.'
            re.data = None
            code = 403
        else:
            org = sm.session.query(Organization).filter_by(
                uuid = data['uuid_organization']
            ).first()
            category = sm.session.query(UserCategory).filter_by(
                category=UserCategoryEnum[data['category']]
            ).first()
            if not org:
                re.success = False
                re.message = 'Could not find organization'
                re.data = None
                code = 403
            if not category:
                re.success = False
                re.message = 'Could not find category'
                re.data = None
                code = 403
            else:
                user.id_organization = org.id
                user.id_category = category.id
                user.username = data['username']
                user.password_hash = user.hash_password(data['password'])
                user.first_name = data.get('first_name')
                user.last_name = data.get('last_name')
                user.email = data.get('email')
                user.is_active = data.get('is_active')
                user.is_admin = data.get('is_active')
                sm.session.add(user)
                sm.session.commit()
                re.data = user.to_dict()
                re.success = True
                re.message = f'User #{user.id} successfully created.'
    except Exception as e:
        sm.session.rollback()
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        re.data = []
    return response_jsonified(re, code)


@user_app.route('/users/<id>/delete', methods=('POST',))
@admin_login_required
def delete_user(id):
    sm = SessionManager()
    re = ResponseEnvelope()
    code = 200
    try:
        user = sm.session.query(User).filter_by(id=id).first()
        if not user:
            re.success = False
            re.message = 'Could not find user.'
            re.data = None
            code = 403
        else:
            User.query.filter_by(id=id).delete()
            sm.session.delete(user)
            sm.session.commit()
            re.data = user.to_dict()
            re.success = True
            re.message = f'User #{id} successfully deleted.'
    except Exception as e:
        sm.session.rollback()
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        re.data = None
    return response_jsonified(re, code)
