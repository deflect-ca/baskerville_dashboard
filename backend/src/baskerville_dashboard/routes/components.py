import os
import traceback

from baskerville_dashboard.auth import login_required
from baskerville_dashboard.utils.helpers import ResponseEnvelope, \
    response_jsonified, get_docker_ps
from flask import Blueprint

from baskerville_dashboard.db.manager import SessionManager


components_app = Blueprint('submit_app', __name__)


@components_app.route('/components/all', methods=['GET'])
def get_available_components():
    re = ResponseEnvelope()
    code = 200
    try:
        # return a list of components: from docker-compose?
        re.data = get_docker_ps()
        re.success = True
        re.message = f'{len(re.data)} components found'
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()
    return response_jsonified(re, code)


@components_app.route('/components/available-services', methods=['GET'])
def docker_compose_config():
    from compose.cli.main import TopLevelCommand, project_from_options
    path = '/Users/mariakaranasou/Projects/EQualitie/opensource/deflect-analytics-ecosystem/'
    ps_options = {"--project-directory": path, "--quiet": False, '--services': True, '--all': True}
    config_options = {"--project-directory": path, '--services': True, "--quiet": False,}
    options = {"--no-deps": False,
               "--abort-on-container-exit": False,
               "SERVICE": True,
               "--remove-orphans": False,
               "--resolve-image-digests": False,
               "--no-recreate": True,
               "--force-recreate": False,
               "--build": False,
               '--no-build': False,
               '--no-color': False,
               "--rmi": "none",
               "--volumes": "",
               "--follow": False,
               "--timestamps": False,
               "--tail": "all",
               "--quiet": False,
               "-d": True,
               '--services': True,
               "--project-directory": path,
               }

    project = project_from_options(path, options)
    cmd = TopLevelCommand(project, options)
    re = ResponseEnvelope()
    re.message = 'TADA'
    re.data = cmd.ps(config_options)
    code = 200
    return response_jsonified(re, code)


@components_app.route('/components/<service_name>/start', methods=['POST'])
@login_required
def component_start(service_name):
    re = ResponseEnvelope()
    re.success = True
    re.data = []
    re.message = f'No components found.'
    code = 200
    try:
        pass
        # from compose.cli.main import TopLevelCommand, project_from_options
        # options = {"--no-deps": False,
        #            "--abort-on-container-exit": False,
        #            "SERVICE": service_name,
        #            "--remove-orphans": False,
        #            "--no-recreate": True,
        #            "--force-recreate": False,
        #            "--build": False,
        #            '--no-build': False,
        #            '--no-color': False,
        #            "--rmi": "none",
        #            "--volumes": "",
        #            "--follow": False,
        #            "--timestamps": False,
        #            "--tail": "all",
        #            "-d": True,
        #            }
        #
        # project = project_from_options(os.path.dirname(__file__), options)
        # cmd = TopLevelCommand(project)
        # cmd.up(options)
        # cmd.ps({'--services': True})
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)


@components_app.route('/components/<service_name>/stop', methods=['POST'])
@login_required
def component_stop(service_name):
    re = ResponseEnvelope()
    re.success = True
    re.data = []
    re.message = f'No components found.'
    code = 200
    try:
        pass
        # from compose.cli.main import TopLevelCommand, project_from_options
        # options = {"--no-deps": False,
        #            "--abort-on-container-exit": False,
        #            "SERVICE": service_name,
        #            "--remove-orphans": False,
        #            "--no-recreate": True,
        #            "--force-recreate": False,
        #            "--build": False,
        #            '--no-build': False,
        #            '--no-color': False,
        #            "--rmi": "none",
        #            "--volumes": "",
        #            "--follow": False,
        #            "--timestamps": False,
        #            "--tail": "all",
        #            "-d": True,
        #            }
        #
        # project = project_from_options(os.path.dirname(__file__), options)
        # cmd = TopLevelCommand(project)
        # cmd.up(options)
        # cmd.ps({'--services': True})
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)


@components_app.route('/components/<service_name>/restart', methods=['POST'])
@login_required
def component_restart(service_name):
    re = ResponseEnvelope()
    re.success = True
    re.data = []
    re.message = f'No components found.'
    code = 200
    try:
        pass
        # from compose.cli.main import TopLevelCommand, project_from_options
        # options = {"--no-deps": False,
        #            "--abort-on-container-exit": False,
        #            "SERVICE": service_name,
        #            "--remove-orphans": False,
        #            "--no-recreate": True,
        #            "--force-recreate": False,
        #            "--build": False,
        #            '--no-build': False,
        #            '--no-color': False,
        #            "--rmi": "none",
        #            "--volumes": "",
        #            "--follow": False,
        #            "--timestamps": False,
        #            "--tail": "all",
        #            "-d": True,
        #            }
        #
        # project = project_from_options(os.path.dirname(__file__), options)
        # cmd = TopLevelCommand(project)
        # cmd.up(options)
        # cmd.ps({'--services': True})
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)

