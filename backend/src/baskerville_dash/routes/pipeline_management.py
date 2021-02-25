import subprocess
import traceback

from baskerville_dash.auth import login_required
from baskerville_dash.utils.helpers import ResponseEnvelope, \
    response_jsonified, get_baskerville_config_path
from flask import Blueprint, request

pipeline_management_app = Blueprint('pipeline_management_app', __name__)
CMD = {
    'postprocessing': 'spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=6 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=2g $BASKERVILLE_ROOT/src/baskerville/main.py postprocessing -c $BASKERVILLE_ROOT/conf/postprocessing.yaml',
    'preprocessing': 'spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=6 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=2g $BASKERVILLE_ROOT/src/baskerville/main.py postprocessing -c $BASKERVILLE_ROOT/conf/postprocessing.yaml',
    'predicting': 'spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=6 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=2g $BASKERVILLE_ROOT/src/baskerville/main.py postprocessing -c $BASKERVILLE_ROOT/conf/postprocessing.yaml'
}


@pipeline_management_app.route('/pipeline/config/<pipeline_name>', methods=['GET'])
@login_required
def get_config(pipeline_name):
    re = ResponseEnvelope()
    re.success = True
    re.data = ''
    code = 200
    try:
        with open(get_baskerville_config_path(), 'r+') as ifile:
            lines = ifile.readlines()
            re.data = ''.join(lines)
            print(re.data)
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)


@pipeline_management_app.route('/submit', methods=['POST'])
@login_required
def spark_submit():
    data = request.to_json()['data']
    config = data['config']
    user = data['user']  # todo

    re = ResponseEnvelope()
    re.success = True
    re.data = []
    re.message = f'No components found.'
    code = 200
    try:
        subprocess.call(["ls", "-l"])
    except Exception as e:
        re.success = False
        re.message = str(e)
        code = 500
        traceback.print_exc()

    return response_jsonified(re, code)


def get_spark_submit_command(config):
    conf_str = f'{"--conf ".join(config)}'
    return """
    """


"""
spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=6 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=2g $BASKERVILLE_ROOT/src/baskerville/main.py postprocessing -c $BASKERVILLE_ROOT/conf/postprocessing.yaml

spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=4 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=2g $BASKERVILLE_ROOT/src/baskerville/main.py predicting -c $BASKERVILLE_ROOT/conf/predicting.yaml

spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=26 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=10g $BASKERVILLE_ROOT/src/baskerville/main.py postprocessing -c $BASKERVILLE_ROOT/conf/preprocessing.yaml
"""