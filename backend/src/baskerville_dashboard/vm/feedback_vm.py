# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
from typing import List, Type

from baskerville.db.dashboard_models import SubmittedFeedback, FeedbackContext, \
    Feedback
from baskerville.db.models import Attack, RequestSet
from baskerville.util.enums import FeedbackContextTypeEnum, \
    FEEDBACK_CONTEXT_TO_DESCRIPTION, BaseStrEnum
from baskerville_dashboard.db.manager import SessionManager


class FeedbackVM(object):
    feedback_context: FeedbackContext
    rs: List[RequestSet]
    feedback: List[SubmittedFeedback]
    feedback_context_cols = {
        'start', 'stop', 'ip_count', 'notes',
        'progress_report'
    }

    def __init__(self, fc: FeedbackContext, save=False):
        self.feedback_context = fc
        self.save = save
        self.uuid_organization = None
        self.feedback = self.process()

    def process(self):
        sm = SessionManager()
        submitted_feedback_list = []
        feedback_list = sm.session.query(Feedback).filter_by(
            id_feedback_context=self.feedback_context.id
        )
        for f in feedback_list:
            submitted_feedback = SubmittedFeedback()
            submitted_feedback.id_context = self.feedback_context.id
            submitted_feedback.uuid_organization = f.user.organization.uuid
            submitted_feedback.uuid_request_set = f.uuid_request_set
            submitted_feedback.prediction = f.prediction
            submitted_feedback.score = f.score
            submitted_feedback.attack_prediction = f.attack_prediction
            submitted_feedback.low_rate = f.low_rate
            submitted_feedback.features = f.features
            submitted_feedback.feedback = f.feedback
            submitted_feedback.start = f.start
            submitted_feedback.stop = f.stop
            from datetime import datetime
            submitted_feedback.submitted_at = datetime.utcnow()
            if not self.uuid_organization:
                self.uuid_organization = submitted_feedback.uuid_organization
            if self.save:
                sm.session.add(submitted_feedback)
                sm.session.commit()
            submitted_feedback_list.append(submitted_feedback)
        return submitted_feedback_list

    def set_pending(self, pending):
        sm = SessionManager()
        self.feedback_context.pending = pending
        sm.session.commit()

    def to_dict(self):
        return {
            'progress_count': '1/1',
            'id_context': self.feedback_context.id,
            'uuid_organization': self.uuid_organization,
            'feedback_context': self.feedback_context.to_dict(
                # cols=self.feedback_context_cols
            ),
            'feedback': [f.to_dict() for f in self.feedback]
        }


class FeedbackContextVM(object):
    feedback_contexts: List[FeedbackContext]
    feedback_context_type: Type[FeedbackContextTypeEnum]
    feedback_context_type_to_descr: dict

    def process(self):
        sm = SessionManager()
        self.feedback_contexts = sm.session.query(FeedbackContext).all()
        self.feedback_context_type = FeedbackContextTypeEnum
        self.feedback_context_type_to_descr = FEEDBACK_CONTEXT_TO_DESCRIPTION

    def to_dict(self):
        self.process()
        fct = self.feedback_context_type.__dict__
        return {
            'feedback_contexts': [fc.to_dict() for fc in self.feedback_contexts],
            'feedback_context_type': dict(
                zip(fct['_member_names_'], fct['_value2member_map_'].keys())
            ),
            'feedback_context_type_to_descr': {
                k.value: v for k, v in
                self.feedback_context_type_to_descr.items()
            }
        }

