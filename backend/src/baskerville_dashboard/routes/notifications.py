# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
import traceback

import uuid
from baskerville.db.dashboard_models import PendingWork, Notification
from baskerville.models.config import TrainingConfig
from baskerville.util.helpers import parse_config
from baskerville_dashboard.auth import login_required
from baskerville_dashboard.db.manager import SessionManager
from baskerville_dashboard.utils.helpers import ResponseEnvelope,\
    get_user_by_org_uuid
from baskerville_dashboard.utils.helpers import response_jsonified
from flask import Blueprint, session

notifications_app = Blueprint('notifications_app', __name__)


@notifications_app.route('/notifications', methods=('GET',))
@login_required
def all_notifications():
    sm = SessionManager()
    re = ResponseEnvelope()
    try:
        code = 200
        user = get_user_by_org_uuid(session['org_uuid'])
        notifications = sm.session.query(Notification).filter_by(id_user=user.id).all()
        if not notifications:
            notifications = sm.session.query(
                Notification
            ).filter_by(uuid_organization=session['org_uuid']).all()
        re.data = [n.to_dict() for n in notifications]
        re.message = 'All notifications'
        re.success = True
    except Exception as e:
        code = 500
        traceback.print_exc()
        re.success = False
        re.message = str(e)

    return response_jsonified(re, code)
