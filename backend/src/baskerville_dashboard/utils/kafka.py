# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
import asyncio
import json

from baskerville.models.config import KafkaConfig
from kafka import KafkaProducer
from sqlalchemy.exc import SQLAlchemyError

KAFKA_CONSUMER = None
ASYNC_KAFKA_CONSUMER = None
KAFKA_PRODUCER = None


def value_deserializer(v):
    try:
        return json.loads(v.decode('utf-8'))
    except:
        return {}


def get_kafka_consumer(kafka_config: KafkaConfig, topics=()):
    global KAFKA_CONSUMER
    from kafka import KafkaConsumer
    from kafka.client_async import selectors
    if not KAFKA_CONSUMER:
        KAFKA_CONSUMER = KafkaConsumer(
            *topics,
            bootstrap_servers=kafka_config['bootstrap_servers'],
            selector=selectors.DefaultSelector,
            auto_offset_reset='earliest',
            value_deserializer=value_deserializer
        )
    return KAFKA_CONSUMER


def get_aiokafka_consumer(kafka_config: KafkaConfig, topics=()):
    from aiokafka import AIOKafkaConsumer
    # note: for python 3.6 you'll also need to install dataclasses
    global ASYNC_KAFKA_CONSUMER
    if not ASYNC_KAFKA_CONSUMER:
        ASYNC_KAFKA_CONSUMER = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=kafka_config['bootstrap_servers'],
            auto_offset_reset='earliest',
            value_deserializer=value_deserializer
        )
    return ASYNC_KAFKA_CONSUMER


def get_kafka_producer(kafka_config: KafkaConfig):
    global KAFKA_PRODUCER
    from kafka.client_async import selectors
    if not KAFKA_PRODUCER:
        KAFKA_PRODUCER = KafkaProducer(
        bootstrap_servers=kafka_config.bootstrap_servers,
        selector=selectors.DefaultSelector,
        security_protocol=kafka_config['security_protocol'],
        ssl_check_hostname=kafka_config['ssl_check_hostname'],
        ssl_cafile=kafka_config['ssl_cafile'],
        ssl_certfile=kafka_config['ssl_certfile'],
        ssl_keyfile=kafka_config['ssl_keyfile']
    )

    return KAFKA_PRODUCER


def consume_from_kafka(config, baskerville_config):
    from baskerville_dashboard.utils.helpers import get_socket_io
    from baskerville_dashboard.db.manager import SessionManager
    from baskerville.db import set_up_db

    # todo: either pickle it and reload it or use
    feedback_context_cache = {}
    socketio = get_socket_io()
    Session, engine = set_up_db(baskerville_config['database'], create=True)
    sm = SessionManager()
    sm.set_session(Session)
    sm.set_engine(engine)
    kafka_consumer = get_kafka_consumer(
        baskerville_config['kafka'], config.get('KAFKA_TOPICS')
    )
    import time
    for cr in kafka_consumer:
        if cr.value:
            if cr.topic == 'test.feedback':
                try:
                    print('updating feedback context...')
                    fc_id = cr.value['id_context']
                    if fc_id not in feedback_context_cache:
                        feedback_context_cache[fc_id] = True
                        from baskerville.db.dashboard_models import FeedbackContext
                        fc = sm.session.query(FeedbackContext).filter_by(id=fc_id).first()
                        if fc:
                            fc.pending = not cr.value['success']
                            sm.session.commit()
                            socketio.emit(
                                cr.value['uuid_organization'],
                                f'Updated feedback context {fc.id} to not pending'
                            )
                        else:
                            socketio.emit(
                                cr.value['uuid_organization'],
                                f'Could not find fc {fc_id}'
                            )
                except KeyError:
                    pass
                except SQLAlchemyError:
                    sm.session.rollback()
            if cr.topic == 'test.register':
                try:
                    uuid_organization = cr.value['uuid_organization']

                    from baskerville.db.dashboard_models import \
                        Organization
                    org = sm.session.query(Organization).filter_by(
                        uuid=uuid_organization).first()
                    if org:
                        org.registered = not cr.value['success']
                        sm.session.commit()
                        socketio.emit(
                            uuid_organization,
                            f'Organization {uuid_organization} '
                            f'is now registered'
                        )
                    else:
                        t = f'Could not find organization ' \
                            f'uuid={uuid_organization}'
                        socketio.emit(uuid_organization, t)
                except KeyError:
                    pass
                except SQLAlchemyError:
                    sm.session.rollback()
        time.sleep(0.1)

