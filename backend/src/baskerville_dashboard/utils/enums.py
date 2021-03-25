# Copyright (c) 2020, eQualit.ie inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

from baskerville.util.enums import BaseStrEnum


class UserCategoryEnum(BaseStrEnum):
    admin = 'Administrator'
    guest = 'Guest'
    customer = 'Customer'


class FeedbackEnum(BaseStrEnum):
    correct = 'correct'
    incorrect = 'incorrect'
    bot = 'bot'
    not_bot = 'notbot'
    none = ''


class NotificationKind(BaseStrEnum):
    error = 'error'
    warn = 'warn'
    info = 'info'
    debug = 'debug'
