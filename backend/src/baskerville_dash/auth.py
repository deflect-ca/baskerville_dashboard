import json
import traceback
from datetime import datetime, timedelta
from functools import wraps

import jwt
import uuid as uuid

from baskerville.util.enums import UserCategoryEnum
from baskerville_dash.utils.helpers import ResponseEnvelope
from flask import current_app as app, session
from baskerville_dash.db.manager import SessionManager
from baskerville.db.dashboard_models import User, UserCategory, Organization
from flask import request, g
from flask.json import jsonify
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash


def create_token(user):
    """

    :param user:
    :return:
    """
    payload = {
        'sub': user.organization.uuid,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=1),
        'scope': 'admin' if user.is_admin else 'user',
    }
    token = jwt.encode(payload, app.config['JWT_SECRET_KEY'])
    return token.decode('unicode_escape')


def parse_token(req):
    """

    :param req:
    :return:
    """
    token = req.headers.get('Authorization').split()[1]
    return jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms='HS256')


def login_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('Authorization'):
            response = jsonify(message='Missing authorization header')
            response.status_code = 401
            return response
        try:
            payload = parse_token(request)
        except jwt.exceptions.DecodeError:
            print('jwt.exceptions.DecodeError')
            response = jsonify(message='Token is invalid')
            response.status_code = 401
            return response
        except jwt.exceptions.ExpiredSignatureError:
            print('jwt.exceptions.ExpiredSignatureError')
            response = jsonify(message='Token has expired')
            response.status_code = 401
            return response
        print('Setting UUID.....')
        session['org_uuid'] = payload['sub']

        return f(*args, **kwargs)

    return decorated_function


def admin_login_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('Authorization'):
            response = jsonify(message='Missing authorization header')
            response.status_code = 401
            return response

        try:
            payload = parse_token(request)
            if payload['scope'] != "admin":
                response = jsonify(error='Admin Access Required')
                response.status_code = 401
                return response
        except jwt.exceptions.DecodeError:
            response = jsonify(message='Token is invalid')
            response.status_code = 401
            return response
        except jwt.exceptions.ExpiredSignatureError:
            response = jsonify(message='Token has expired')
            response.status_code = 401
            return response

        session['org_uuid'] = payload['sub']

        return f(*args, **kwargs)

    return decorated_function


class Auth(object):
    jwtApp = None

    def __init__(self):
        self.sm = SessionManager()
        self.session = self.sm.session

    def post(self):
        from baskerville.db.dashboard_models import User

        msg = ResponseEnvelope()
        raw_dict = request.get_json(force=True)
        data = raw_dict['data']
        email = data.get('email', '')
        password = data.get('password', '')
        user = self.session.query(User).filter_by(email=email).first()
        if user is None:
            msg.message = "Invalid username/ password"
            return json.dumps(msg.to_dict()), 401
        # check_password_hash(user.password_hash, password)
        if not user.is_active:
            msg.message = "Account deactivated. Please, contact the admins."
            return json.dumps(msg.to_dict()), 401
        if user.verify_password(password):
            token = create_token(user)
            msg.success = True
            msg.data = {
                'token': token,
                'id': user.id,
                'username': user.username,
                'uuid': user.organization.uuid,
                'registered': user.organization.registered,
                'email': user.email,
                'is_admin': user.is_admin,
                'is_active': user.is_active,
                'category': str(user.category.category)
            }
            print(msg.data)
            return json.dumps(msg.to_dict()), 200
        else:
            msg.message = "Invalid username/ password"
            return json.dumps(msg.to_dict()), 401


class SignUp(object):

    def __init__(self):
        self.sm = SessionManager()
        self.session = self.sm.session

    def post(self):
        msg = ResponseEnvelope()
        raw_dict = request.get_json(force=True)
        try:
            request_dict = raw_dict['data']
            user = User(email=request_dict.get('email', ''),
                        password_hash=generate_password_hash(request_dict.get('password', '')),
                        username=request_dict.get('username', ''),
                        is_active=False,
                        is_admin=False)
            self.sm.session.add(user)
            self.sm.session.commit()

            registered_user = self.sm.session.query(User).filter_by(id=user.id)
            msg.data = {
                "id": registered_user.id,
                "email": registered_user.email,
                "username": registered_user.username
            }
            msg.message = "Successful Registration!"
            msg.success = True
            return jsonify(msg.to_dict()), 201

        # except ValidationError as err:
        #     msg.message = err.messages
        #     return jsonify(msg.to_dict()), 403

        except SQLAlchemyError as e:
            self.sm.session.rollback()
            #todo: needs better handling regarding error msgs
            if "Integrity error" in e:
                msg.message = "User already exists."

            return jsonify(msg.to_dict()), 409


class SignUpGuest(object):

    def __init__(self):
        self.sm = SessionManager()

    def post(self):
        msg = ResponseEnvelope()
        try:
            user_uuid = str(uuid.uuid4())
            pass_uuid = str(uuid.uuid4())
            org = self.sm.session.query(
                Organization
            ).filter_by(name='Guest Org.').first()
            user = User(
                email=f'{user_uuid}@{user_uuid}',
                password_hash=generate_password_hash(
                            f'{user_uuid}{pass_uuid}'
                ),
                username=user_uuid,
                is_active=True,
                is_admin=False,
                id_organization=org.id
            )
            user.category = self.sm.session.query(UserCategory).filter_by(
                category=str(UserCategoryEnum.guest)
            ).first()
            self.sm.session.add(user)
            self.sm.session.commit()
            token = create_token(user)
            msg.data = {
                'token': token,
                'id': user.id,
                'username': user.username,
                'uuid': user.organization.uuid,
                'registered': user.organization.registered,
                'email': user.email,
                'is_admin': user.is_admin,
                'is_active': user.is_active,
                'category': str(user.category.category)
            }
            msg.message = f'Welcome guest {user_uuid}!'
            msg.success = True
            return jsonify(msg.to_dict()), 201

        # except ValidationError as err:
        #     msg.message = err.messages
        #     return jsonify(msg.to_dict()), 403

        except SQLAlchemyError as e:
            self.sm.session.rollback()
            traceback.print_exc()
            #todo: needs better handling regarding error msgs
            if "Integrity error" in e.message:
                msg.message = "User already exists."

            return jsonify(msg.to_dict()), 409


class ForgotPassword(object):

    def __init__(self, db_handles):
        self.db_handles = db_handles

    def patch(self):
        if not request.headers.get('Authorization'):
            response = jsonify(message='Missing authorization header')
            response.status_code = 401
            return response

        try:
            print(request.headers.get('Authorization'))
            payload = parse_token(request)
            user_uuid = payload['sub']
            user = self.db_handles.session(User).get_or_404(user_uuid)
            print(request.data)
            raw_dict = request.get_json(force=True)
            request_dict = raw_dict['data']

            user.password = generate_password_hash(request_dict['password'])
            try:
                user.update()
                return 201

            except SQLAlchemyError as e:
                self.db_handles.session.rollback()
                resp = jsonify({"error": str(e)})
                resp.status_code = 401
                return resp
        except JWSDecodeError:
            response = jsonify(message='Token is invalid')
            response.status_code = 401
            return response
        except JWTException:
            response = jsonify(message='Token has expired')
            response.status_code = 401
            return response

    def post(self):
        msg = ResponseEnvelope()
        jsonify(msg.to_dict()), 500
        # request_dict = request.get_json(force=True)['data']
        # email = request_dict.get('email', '')
        # user = User.query.filter_by(email=email).first()
        # if user is None:
        #     msg.message = "Your email is not in our database, are you sure it is correct?"
        #     return json.dumps(msg.to_dict()), 404
        # if user is not None:
        #     token = create_token(user)
        #
        #     try:
        #         # Prepare and send email
        #         email_msg = Message("Here's your Password Reset Link :)", recipients=[email], bcc=[PASSWORD_RESET_EMAIL])
        #         email_msg.html = "Unfortunately this is under construction! " \
        #                          "We will be back and fully operational soon! " \
        #                          "In the mean time, drop us a word if you need help:" +\
        #                          PASSWORD_RESET_EMAIL.format(token=token)
        #                         # TODO: send a url to this server to reset password
        #         mail.send(email_msg)
        #
        #         msg.success = True
        #         msg.message = "Reset link sent successfully. Please, check your email!"
        #         return jsonify(msg.to_dict()), 201
        #
        #     except RuntimeError as e:
        #         msg.message = str(e)
        #         return jsonify(msg.to_dict()), 500
