# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

import traceback
from collections import OrderedDict

from baskerville.db.models import RequestSet, BanjaxBan, Runtime
from baskerville.util.enums import LabelEnum
from baskerville_dashboard.db.manager import SessionManager
from baskerville_dashboard.utils.helpers import ResponseEnvelope
from baskerville_dashboard.utils.helpers import get_active_apps, response_jsonified
from flask import Blueprint


stats_app = Blueprint('stats_app', __name__)


@stats_app.route('/stats', methods=('GET',))
def stats():
    sm = SessionManager()
    response = ResponseEnvelope()
    code = 200

    try:
        runtimes_count = sm.session.query(Runtime).count()
        rs_count = sm.session.query(RequestSet).count()
        rs_malicious_count = sm.session.query(RequestSet).filter(
            RequestSet.prediction == LabelEnum.malicious.value
        ).count()
        rs_benign_count = sm.session.query(RequestSet).filter(
            RequestSet.prediction == LabelEnum.benign.value
        ).count()
        banjax_rs_sync = sm.session.query(RequestSet).filter(
            RequestSet.id_banjax != None
        ).count()
        banjax_sync = sm.session.query(BanjaxBan).count()
        banjax_rs_common = sm.session.query(RequestSet).filter(
            RequestSet.id_banjax != None
        ).filter(RequestSet.prediction == LabelEnum.malicious.value).count()

        current_accuracy = round(banjax_rs_common / banjax_rs_sync, 2)*100 if banjax_rs_sync > 0 else 'N/A'

        # todo: model
        data = OrderedDict([
            ('# of request sets in the database', rs_count),
            ('# of runtimes in the database', runtimes_count),
            ('# of request sets labeled as malicious', rs_malicious_count),
            ('# of request sets labeled as benign', rs_benign_count),
            ('# of request sets that have been cross-referenced with Banjax bans', banjax_rs_sync),
            ('# of synced Banjax bans', banjax_sync),
            ('Correct predictions according to Banjax results', f'{banjax_rs_common} / {banjax_rs_sync}'),
            ('Curernt accuracy (Banjax)', f'{current_accuracy}%')
        ])
        response.success = True
        response.message = 'General Stats'
        response.data = data
    except Exception as e:
        code = 500
        traceback.print_exc()
        response.success = False
        response.message = str(e)

    return response_jsonified(response, code)


# todo: secure
@stats_app.route('/app-stats', methods=['GET'])
def status_check():
    code = 200
    respose = ResponseEnvelope()
    try:
        app_data = get_active_apps()
        respose = ResponseEnvelope()
        respose.success = app_data is not None
        respose.message = 'Current status of applications'
        respose.data = app_data['details'] if app_data else {}
    except Exception as e:
        respose.success = False
        respose.message = str(e)
        code = 500
    return response_jsonified(respose, code)

