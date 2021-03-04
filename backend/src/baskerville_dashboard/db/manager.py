# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
from baskerville.util.helpers import Singleton


class SessionManager(Singleton):

    def set_session(self, Session):
        self.Session = Session

    def set_engine(self, engine):
        self.engine = engine

    @property
    def session(self):
        return self.Session()
