# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
from datetime import datetime


class RetrainVm(object):
    training_config: str
    uuid_organization: str

    def __init__(self, tc: str, uuid_organization: str):
        self.training_config = tc
        self.uuid_organization = uuid_organization
        self.timestamp = datetime.utcnow()

    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'uuid_organization': self.uuid_organization,
            'training_config': self.training_config,
        }

