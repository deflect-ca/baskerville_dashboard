# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
import os
import uuid
import traceback

from pathlib import Path
from baskerville_dashboard.auth import login_required, resolve_user
from baskerville_dashboard.utils.helpers import ResponseEnvelope, get_qparams, \
    get_rss, response_jsonified, get_active_app, get_extension, is_compressed, \
    get_ip_list, unzip, get_user_by_org_uuid
from flask import Blueprint, request, session, url_for
from werkzeug.utils import secure_filename
from baskerville.db.models import RequestSet, Runtime
from baskerville_dashboard.db.manager import SessionManager


results_app = Blueprint('results_app', __name__)

ALLOWED_FILES = {'csv', 'zip', 'xlsx', }


@results_app.route('/results/upload', methods=['POST'])
@login_required
def upload_file():
    response = ResponseEnvelope()
    code = 200
    rs_start = None
    try:
        # check if the post request has the file part
        if 'file' not in request.files:
            response.message = 'No file part'
            return response_jsonified(response, code)
        file = request.files['file']
        if file.filename == '':
            response.message = 'No selected file'
            return response_jsonified(response, code)
        if file and get_extension(file.filename) in ALLOWED_FILES:
            from baskerville_dashboard.app import app
            client_uuid = session['org_uuid']
            file_uuid = str(uuid.uuid4())
            filename = f'{file_uuid}_{secure_filename(file.filename)}'
            folder = os.path.join(app.config['UPLOAD_FOLDER'], client_uuid)
            full_path = os.path.join(folder, filename)
            Path(folder).mkdir(parents=True, exist_ok=True)
            file.save(full_path)
            if is_compressed(full_path):
                ext = get_extension(full_path)
                dot_ext = f'.{ext}'
                _ext = f'_{ext}'
                unzip(full_path, full_path.replace(dot_ext, _ext))
                filename = filename.replace(dot_ext, _ext)

            response.message = f'Csv uploaded successfully.'
            response.data = {
                'org_uuid': client_uuid,
                'filename': filename,
                'results': url_for(
                    'results_app.get_results',
                    app_id=file_uuid,
                )
            }
        else:
            raise ValueError('Invalid extension')
    except Exception as e:
        traceback.print_exc()
        response.message = str(e)
        code = 500
    return response_jsonified(response, code)


@results_app.route('/results', methods=['POST'])
@login_required
@resolve_user
def get_all_results():
    _q_filter = get_qparams(request)
    re = ResponseEnvelope()
    sm = SessionManager()
    re.success = True
    re.data = []
    re.message = f'No results found.'
    code = 200
    ip_list = None
    try:
        org_uuid = session['org_uuid']
        ip_file_name = request.args.get('file')
        user = request.user
        if ip_file_name:
            ip_list = get_ip_list(ip_file_name, org_uuid)
        re.data = get_rss(**_q_filter, user=user, ip_list=ip_list)
        re.message = f'The request sets for {">>"}'
    except Exception as e:
        sm.session.rollback()
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)


@results_app.route('/results/<app_id>', methods=['POST'])
@login_required
@resolve_user
def get_results(app_id: str):
    from flask import session
    _q_filter = get_qparams(request)
    re = ResponseEnvelope()
    re.success = True
    re.data = []
    re.message = f'No results found.'
    code = 200
    ip_list = None
    try:
        sm = SessionManager()
        org_uuid = session['org_uuid']
        if app_id.startswith(org_uuid):
            app_id = app_id.replace(f'{org_uuid}_', '', 1)
        ip_file_name = request.args.get('file')
        user = get_user_by_org_uuid(org_uuid, session['user_id'])
        if not user:
            code = 404
            re.success = False
            re.message = 'No user found'
            return response_jsonified(re, code)
        runtime_q = sm.session.query(Runtime)
        runtime = runtime_q.filter(
            Runtime.file_name.like(f'%{app_id}%')
        ).first()
        if runtime:
            if ip_file_name:
                ip_list = get_ip_list(ip_file_name, org_uuid)
            re.data = get_rss(
                **_q_filter, id_runtime=runtime.id, user=user, ip_list=ip_list
            )
            re.message = f'The results of {app_id} run.'
        else:
            re.data = {'data': [], 'total_num_pages': 0}
            re.message = 'No results'
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)
