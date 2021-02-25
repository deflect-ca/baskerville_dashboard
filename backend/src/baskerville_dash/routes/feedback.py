# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
import traceback

from baskerville.util.enums import FeedbackContextTypeEnum
from baskerville_dash.auth import login_required
from baskerville_dash.db.manager import SessionManager
from baskerville.db.dashboard_models import User, Feedback, FeedbackContext
from baskerville_dash.utils.helpers import ResponseEnvelope, \
    response_jsonified, ALLOWED_FEEDBACK, get_qparams, \
    get_ip_list, get_rss, get_user_by_org_uuid, submit_feedback_vm, \
    camel_case_to_snake_case, convert_dict_to_snake_case
from baskerville_dash.view_models.feedback_vm import FeedbackContextVM, \
    FeedbackVM
from flask import Blueprint, request, g, session
from baskerville.db.models import RequestSet, Attack

feedback_app = Blueprint('feedback_app', __name__)

ES_HOST = ''


@feedback_app.route('/feedback/context', methods=('GET',))
@login_required
def get_feedback_context_details():
    """
    Get all available feedback context, feedback context type and respective
    description
    :return:
    """
    re = ResponseEnvelope()
    sm = SessionManager()
    code = 200
    try:
        re.data = FeedbackContextVM().to_dict()
        print('REDATA', re.data)
        re.success = True
        re.message = 'Feedback context details'
    except Exception as e:
        sm.session.rollback()
        traceback.print_exc()
        code = 500
        re.success = False
        re.message = str(e)
    return response_jsonified(re, code)


@feedback_app.route('/feedback/context/<id>', methods=('GET',))
@login_required
def get_feedback_context_by_id(id):
    """
    Get a specific feedback context by id
    :param int id:
    :return:
    """
    re = ResponseEnvelope()
    sm = SessionManager()
    code = 200
    try:
        re.data = sm.session.query(FeedbackContext).filter_by(id=id).first()
        if not re.data:
            code = 404
            raise ValueError(f'Could not find feedback context with id {id}')
        re.data = re.data.to_dict()
        re.success = True
        re.message = 'Feedback context'
    except Exception as e:
        traceback.print_exc()
        if code == 200:
            code = 500
        re.success = False
        re.message = str(e)
    return response_jsonified(re, code)


@feedback_app.route('/feedback/context', methods=('POST',))
@login_required
def save_feedback_context():
    re = ResponseEnvelope()
    sm = SessionManager()
    code = 200

    try:
        data = convert_dict_to_snake_case(request.get_json())
        fc = FeedbackContext()
        fc.reason = FeedbackContextTypeEnum[data['reason'].replace(' ', '_')]
        fc.uuid_organization = session['org_uuid']
        fc.reason_descr = data['reason_descr']
        fc.start = data['start']
        fc.stop = data['stop']
        fc.notes = data['notes']
        fc.pending = True
        sm.session.add(fc)
        sm.session.commit()
        re.data = fc.to_dict()
        re.success = True
        re.message = 'Feedback context successfully created'
    except Exception as e:
        traceback.print_exc()
        code = 500
        re.success = False
        re.message = str(e)
    return response_jsonified(re, code)


@feedback_app.route('/feedback/<context_id>/<feedback_str>', methods=('POST',))
@login_required
def bulk_feedback(context_id, feedback_str):

    re = ResponseEnvelope()
    sm = SessionManager()
    code = 200
    updated = 0
    created = 0
    if feedback_str not in ALLOWED_FEEDBACK:
        code = 404
        re.success = False
        re.message = 'No such feedback'
        print(re.message)
        return response_jsonified(re, code)
    try:
        data = request.get_json()
        errors = []
        succeeded = []
        user = get_user_by_org_uuid(session['org_uuid'])
        if not user:
            code = 404
            re.success = False
            re.message = 'No user found'
            print(re.message)
            return response_jsonified(re, code)

        for id in data['rss']:
            rs = sm.session.query(RequestSet).filter_by(id=id).first()
            if not rs:
                errors.append(id)
            else:
                succeeded.append(rs.id)
            feedback = sm.session.query(Feedback).filter_by(
                uuid_request_set=rs.uuid_request_set).filter_by(
                id_user=user.id
            ).first()
            if feedback:
                updated += 1
            else:
                feedback = Feedback()
                created += 1
            feedback.uuid_request_set = rs.uuid_request_set
            feedback.id_feedback_context = context_id
            feedback.id_user = user.id
            feedback.ip = rs.ip
            feedback.target = rs.target
            feedback.prediction = rs.prediction
            feedback.features = rs.features
            feedback.start = rs.start
            feedback.stop = rs.stop
            feedback.low_rate = data.get('low_rate')
            feedback.score = rs.score
            feedback.attack_prediction = rs.attack_prediction or 42
            feedback.feedback = feedback_str
            if not updated:
                sm.session.add(feedback)
        if not errors:
            sm.session.commit()
            re.message = f'Successfuly created feedback for #{created} ' \
                         f'request sets and ' \
                         f'updated it for #{updated}.'
        else:
            sm.session.rollback()
            re.message = 'Could not perform transaction.'
        re.success = len(errors) == 0
        re.data = {
            'errors': errors,
            'succeeded': succeeded
        }
    except Exception as e:
        sm.session.rollback()
        traceback.print_exc()
        code = 500
        re.success = False
        re.message = str(e)
    return response_jsonified(re, code)


@feedback_app.route('/feedback/<context_id>/<rs_id>/<feedback_str>', methods=('POST', 'PUT'))
@login_required
def set_feedback_for(context_id, rs_id, feedback_str):
    sm = SessionManager()
    re = ResponseEnvelope()
    code = 200
    updated = False
    print(request.headers)
    client_uuid = session['org_uuid']
    print('CLIENT UUID', client_uuid)
    if feedback_str not in ALLOWED_FEEDBACK:
        code = 404
        re.success = False
        re.message = 'No such feedback'
        print(re.message)
        return response_jsonified(re, code)
    try:
        # find rs:
        # todo: this could take a long time
        rs = sm.session.query(RequestSet).filter_by(id=rs_id).first()

        if not rs:
            raise Exception('No such request-set')
        user = get_user_by_org_uuid(session['org_uuid'])
        if not user:
            raise Exception('No user found.')

        feedback = sm.session.query(Feedback).filter_by(
            uuid_request_set=rs.uuid_request_set
        ).filter_by(id_user=user.id).first()
        if feedback:
            updated = True
        else:
            feedback = Feedback()
        feedback.uuid_request_set = rs.uuid_request_set
        feedback.id_feedback_context = context_id
        feedback.id_user = user.id
        feedback.ip = rs.ip
        feedback.target = rs.target
        feedback.prediction = rs.prediction
        feedback.start = rs.start
        feedback.stop = rs.stop
        feedback.low_rate = request.get_json().get('lowRate')
        feedback.features = rs.features
        feedback.score = rs.score
        feedback.attack_prediction = rs.attack_prediction or 42
        feedback.feedback = feedback_str
        if not updated:
            sm.session.add(feedback)
        sm.session.flush()
        sm.session.commit()
        re.success = True
        re.message = f'Feedback for {rs_id} {"updated" if updated else "stored"} successfully'
        re.data = feedback.id
    except Exception as e:
        traceback.print_exc()
        sm.session.rollback()
        re.success = False
        re.message = str(e)
        code = 500

    return response_jsonified(re, code)


@feedback_app.route('/feedback/submit/<context_id>', methods=('POST',))
@login_required
def submit_feedback_for(context_id):
    _q_filter = get_qparams(request)
    sm = SessionManager()
    re = ResponseEnvelope()
    code = 200
    ip_list = None
    data = request.get_json()
    try:
        user = get_user_by_org_uuid(session['org_uuid'])
        fc = sm.session.query(FeedbackContext).filter_by(id=context_id).first()
        if not fc:
            print('TODO: could not find Feedback Context')
        feedback_list = sm.session.query(Feedback).filter_by(
            id_feedback_context=fc.id
        ).all()

        if not feedback_list:
            code = 403
            raise ValueError(
                'No feedback to send. '
                'Try again by marking one or more request sets'
            )

        feedback_vm = FeedbackVM(fc, feedback_list)
        print(feedback_vm.to_dict())
        submit_feedback_to_isac(feedback_vm)
        re.data = None
        re.success = True
        re.message = 'Feedback context details'
    except Exception as e:
        traceback.print_exc()
        re.success = False
        re.message = str(e)
        if code == 200:
            code = 500

    return response_jsonified(re, code)


def submit_feedback_to_isac(feedback_vm: FeedbackVM):
    result = submit_feedback_vm(feedback_vm)
    if result:
        from baskerville_dash.utils.helpers import get_socket_io
        socket_io = get_socket_io()
        socket_io.emit(session['org_uuid'], 'Feedback submitted successfully')


def deflect_kibana_url(rs, index='deflect.log'):
    import urllib

    start = rs.start.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    stop = rs.stop.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    root = f"{ES_HOST}/dash/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0)"
    time = f"time:(from:'{start}',mode:absolute,to:'{stop}')"
    index = f"index:%5B{index}-%5DYYYY.MM.DD"
    interval = "interval:auto"
    q = f"query:(query_string:(query:'client_request_host:*{urllib.parse.quote(rs.target)}*%20AND%20client_ip%20:{urllib.parse.quote(rs.ip)}'))"
    sort_ = "sort:!('@timestamp',desc)"

    return f'{root},{time})&_a=({index},{interval},{q},{sort_})'


def banjax_kibana_url(rs):
    import urllib

    start = rs.start.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    stop = rs.stop.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    root = f"{ES_HOST}/dash/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0)"
    time = f"time:(from:'{start}',mode:absolute,to:'{stop}')"
    index = f"index:%5Bbanjax-%5DYYYY.MM.DD"
    interval = "interval:auto"
    q = f"query:(query_string:(query:'http_host:*{urllib.parse.quote(rs.target)}*%20AND%20client_ip%20:{urllib.parse.quote(rs.ip)}'))"
    sort_ = "sort:!('@timestamp',desc)"

    return f'{root},{time})&_a=({index},{interval},{q},{sort_})'
