# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
import traceback

from baskerville.db.dashboard_models import Message
from baskerville_dashboard.auth import login_required
from baskerville_dashboard.db.manager import SessionManager
from baskerville_dashboard.utils.helpers import ResponseEnvelope,\
    get_user_by_org_uuid
from baskerville_dashboard.utils.helpers import response_jsonified
from flask import Blueprint, session
from sqlalchemy import desc

messages_app = Blueprint('messages_app', __name__)


@messages_app.route('/messages', methods=('GET',))
@login_required
def all_notifications():
    sm = SessionManager()
    re = ResponseEnvelope()
    try:
        code = 200
        user = get_user_by_org_uuid(session['org_uuid'])
        notifications = sm.session.query(
            Message
        ).filter_by(uuid_organization=session['org_uuid'])
        if not user.is_admin:
            notifications = notifications.filter_by(
                id_user=user.id
            )
        notifications = notifications.order_by(desc(Message.created_at)).all()
        re.data = [n.to_dict() for n in notifications]
        re.message = 'All notifications'
        re.success = True
    except Exception as e:
        code = 500
        traceback.print_exc()
        re.success = False
        re.message = str(e)

    return response_jsonified(re, code)
