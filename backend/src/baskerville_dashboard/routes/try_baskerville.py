# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

import os
import traceback
import uuid
from datetime import datetime
from multiprocessing import Process

import requests

from pathlib import Path

from baskerville_dashboard.auth import login_required
from baskerville_dashboard.utils.helpers import response_jsonified, allowed_file, \
    validate_config, get_active_app, unzip, init_active_apps, \
    get_baskerville_config, ReadLogs, ResponseEnvelope, is_compressed, \
    get_extension, start_local_baskerville, get_default_data_path
from requests.auth import HTTPBasicAuth
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, g, session, current_app, url_for

try_baskerville_app = Blueprint('try_baskerville_app', __name__)


@try_baskerville_app.route('/try/upload/temp', methods=['POST'])
@login_required
def upload_temp_file():
    response = ResponseEnvelope()
    code = 200
    rs_start = None
    filename = 'test_data_1k.json'
    try:
        from baskerville_dashboard.app import app
        client_uuid = session['org_uuid']
        file_uuid = str(uuid.uuid4())
        temp_filename = f'{file_uuid}_{secure_filename(filename)}'
        folder = os.path.join(app.config['UPLOAD_FOLDER'], client_uuid)
        full_path = os.path.join(folder, temp_filename)
        Path(folder).mkdir(parents=True, exist_ok=True)
        with open(os.path.join(get_default_data_path(), filename)) as f_temp:
            with open(full_path, 'w+') as f_upload:
                f_upload.write(''.join(f_temp.readlines()))
        response.message = f'Sample logs uploaded successfully.'
        response.data = {
            'org_uuid': client_uuid,
            'filename': temp_filename,
            'results': url_for(
                'results_app.get_results',
                app_id=file_uuid,
            )
        }
    except Exception as e:
        traceback.print_exc()
        response.message = 'Could not upload sample logs.'
        code = 500
    return response_jsonified(response, code)


@try_baskerville_app.route('/try/upload', methods=['POST'])
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
        if file and allowed_file(file.filename):
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

            response.message = f'Logs uploaded successfully.'
            response.data = {
                'org_uuid': client_uuid,
                'filename': filename,
                'results': url_for(
                    'results_app.get_results',
                    app_id=file_uuid,
                )
            }
    except Exception as e:
        traceback.print_exc()
        response.message = str(e)
        code = 500
    return response_jsonified(response, code)


@try_baskerville_app.route('/try', methods=['POST'])
@login_required
@init_active_apps
def start_baskerville_for():
    from baskerville_dashboard.app import ACTIVE_APPS

    from baskerville.util.enums import RunType
    data = request.get_json()
    org_uuid = session['org_uuid']
    file_name = data['filename']
    re = ResponseEnvelope()
    code = 200
    full_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'],
        org_uuid,
        file_name
    )
    if not os.path.exists(full_path):
        re.success = False
        re.message = f'Could not locate {file_name}'
        code = 404
        return response_jsonified(re, code)

    pipeline = RunType[current_app.config['PIPELINE']]

    config = get_baskerville_config()
    app_name = f'{org_uuid}_{file_name}'
    spark_file_path = f'{full_path}/*.json' if is_compressed(full_path) \
        else full_path

    log_path = os.path.join(
        current_app.config['UPLOAD_FOLDER'],
        org_uuid,
        f'{app_name}_baskerville.log'
    )
    config['engine']['raw_log']['paths'] = [spark_file_path]
    config['engine']['logpath'] = log_path
    config['engine']['id_client'] = org_uuid
    config_errors = validate_config(config)

    if config_errors:
        re.success = False
        re.message = jsonify(config_errors)
        code = 422
    else:
        try:
            p = Process(
                daemon=True,
                name=app_name,
                target=start_local_baskerville,
                args=(config, pipeline),
                kwargs={
                    'BASKERVILLE_ROOT': os.environ['BASKERVILLE_ROOT'],
                    'DB_HOST': os.environ['DB_HOST'],
                    'DB_USER': os.environ['DB_USER'],
                    'DB_PASS': os.environ['DB_PASS'],
                    'DB_PORT': os.environ['DB_PORT'],
                }
            )
            from baskerville_dashboard.app import socketio
            t = ReadLogs(org_uuid, log_path)

            ACTIVE_APPS[org_uuid] = {
                'process': p,
                'log_thread': t,
                'file_path': full_path,
                'config': config,
                'details': {
                    'pipeline': str(pipeline),
                    'started_at': datetime.utcnow(),
                    'active': p.is_alive()
                }
            }

            # register(org_uuid)
            ACTIVE_APPS[org_uuid]['process'].start()
            ACTIVE_APPS[org_uuid]['log_thread'].start()
            re.success = True
            re.message = f'Application {app_name} submitted successfully'
            re.data = {
                'app_name': app_name,
                'app_id': org_uuid
            }
            session['app_id'] = app_name

        except Exception as e:
            traceback.print_exc()
            re.success = False
            re.message = str(e)
            # re.data = e
            code = 500

    return response_jsonified(re, code)


@try_baskerville_app.route('/try-baskerville/submit', methods=['GET', 'POST'])
@login_required
def submit_app():
    # https://stackoverflow.com/questions/50470394/submitting-python-script-with-apache-spark-hidden-rest-api
    BASKERVILLE_ROOT = os.environ['BASKERVILLE_ROOT']
    url = 'https://localhost:4042/api/v1/submissions/create'
    data = {
        "action": "CreateSubmissionRequest",
        "appArgs": [
                f"{BASKERVILLE_ROOT}/src/baskerville/main.py",
                'dashboard'
            ],
        "appResource": f"file:{BASKERVILLE_ROOT}/src/baskerville/main.py",
        "clientSparkVersion": "2.4.5",
        "environmentVariables": {
            "SPARK_ENV_LOADED": "1",
            "BASKERVILLE_HOME": BASKERVILLE_ROOT
        },
        "mainClass": "org.apache.spark.deploy.SparkSubmit",
        "sparkProperties": {
            "spark.driver.supervise": "false",
            "spark.app.name": "Simple App",  # todo: generate a uuid
            "spark.eventLog.enabled": "true",
            # "spark.submit.deployMode": "cluster",
            "spark.master": "spark://localhost:4042"
        }
    }
    result = requests.post(
        url,
        # data=json.dumps(data),
        data=data,
        verify=False,
        auth=HTTPBasicAuth(
            os.environ['ADMIN_USERNAME'], os.environ['ADMIN_PASS']
        )
    )

    return result.status_code
    #     POST
    #     http: // [spark - cluster - ip]: 6066 / v1 / submissions / create - -header
    #     "Content-Type:application/json;charset=UTF-8" - -data
    #     '{
    #     "action": "CreateSubmissionRequest",
    #     "appArgs": [
    #         "${BASKERVILLE_HOME}/main.py"
    #     ],
    #     "appResource": "file:/home/eliasah/Desktop/spark_pi.py",
    #     "clientSparkVersion": "2.2.1",
    #     "environmentVariables": {
    #         "SPARK_ENV_LOADED": "1"
    #     },
    #     "mainClass": "org.apache.spark.deploy.SparkSubmit",
    #     "sparkProperties": {
    #         "spark.driver.supervise": "false",
    #         "spark.app.name": "Simple App",
    #         "spark.eventLog.enabled": "true",
    #         "spark.submit.deployMode": "cluster",
    #         "spark.master": "spark://[spark-master]:6066"
    #     }
    #
    # }'
    pass


@try_baskerville_app.route('/app/<app_id>', methods=['GET'])
@login_required
def app_details(app_id):
    code = 200
    respose = ResponseEnvelope()
    details = {}
    try:
        app_data = get_active_app(app_id)
        respose.success = True
        respose.message = f'The data for app_id: {app_id}'
        if app_data:
            details = app_data['details']
            details['running'] = app_data['process'].is_alive()
        respose.data = details
    except Exception as e:
        respose.success = False
        respose.message = str(e)
        code = 500
        traceback.print_exc()
    return response_jsonified(respose, code)
