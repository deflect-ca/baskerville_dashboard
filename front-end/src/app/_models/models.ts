export enum UserCategoryEnum {
  unknown = 'Unknown',
  guest = 'Guest',
  admin = 'Administrator',
  user = 'User',
}

export class User {
  id: number;
  username: string;
  uuid: string;
  email: string;
  category: UserCategoryEnum;
  isAdmin: boolean;
  isActive: boolean;
  registered: boolean;
  token: string;


  constructor(options?: any) {
    options = JSONCamelCase.convert(options) || {};
    this.id = options.id || null;
    this.username = options.username || null;
    this.email = options.email || null;
    this.uuid = options.uuid || null;
    this.category = options.category || options.idCategory || UserCategoryEnum.unknown;
    this.isAdmin = options.isAdmin === true;
    this.isActive = options.isActive === true;
    this.registered = options.registered === true;
    this.token = options.token || '';
  }
  static excludeFromView(): Array<string> {
    return ['token'];
  }
  canViewAdmin(): boolean {
    return this.isAdmin && this.isActive;
  }
}
export class JSONCamelCase {

  static convert(data): any {
    // https://hisk.io/javascript-snake-to-camel/
    return JSON.parse(JSON.stringify(data).replace(
      /([-_][a-z])/g,
      (group) => group.toUpperCase().replace('-', '').replace('_', '')
    ));
  }
}

export enum NotificationType {
  error = 'danger',
  info = 'info',
  warning = 'warning',
  success = 'success',
  basic = 'basic',
  unknown = '',
}

export class Notification {
  id: number;
  createdAt: string;
  updatedAt: string;
  severity: string;
  kind: NotificationType = NotificationType.info;
  message = '';
  url: string = '';

  constructor(props) {
    props = JSONCamelCase.convert(props);
    this.id = props.id;
    this.kind = props.kind || NotificationType.unknown;
    this.message = props.message || '_';
    this.createdAt = props.createdAt || '';
    this.updatedAt = props.updatedAt || '';
    this.severity = props.severity || '';
    this.url = props.url || '';
  }
  getColor(): string {
    switch (this.kind) {
      case NotificationType.info: return 'blue';
      case NotificationType.warning: return 'yellow';
      case NotificationType.success: return 'green';
      case NotificationType.error: return 'red';
      case NotificationType.basic: return '';
      case NotificationType.unknown: return '';
      default: return '';
    }
  }
}

export class Envelop {
  success: boolean;
  message: string;
  data: any;

  constructor() {
    this.success = false;
    this.message = '';
  }
}

export const Labels = {
  malicious: 1,
  benign: 0,
  unknown: 42
};

export const BotToLabels = {
  bot: 'malicious',
  notbot: 'benign',
  unknown: 'unknown'
};

// todo: use Labels and reverse
export const ReverseLabels = {
  '-1': 'malicious',
  1: 'benign',
  null: 'unknown'
};


export const FeedbackEnum = {
  correct: 'correct',
  incorrect: 'incorrect',
  '': ''
};

export const BotNotBotEnum = {
  BOT: 'bot',
  NOTBOT: 'notbot',
  '': ''
};

export const FeedbackReversedEnum = {
  success: 'correct',
  danger: 'incorrect',
  '': ''
};

export class RequestSet {
  id: string;
  target: string;
  ip: string;
  start: Date;
  stop: Date;
  prediction: number;
  score: number;
  anomalyScore: number;
  isSelected: boolean;
}

export class Results {
  data: RequestSet[];
  numPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 25;
  numResults: number = 0;

  constructor(props?) {
    props = props || {};
    props = JSONCamelCase.convert(props);
    this.data = props.data as RequestSet[] || [];
    this.numPages = props.numPages || [];
    this.currentPage = props.currentPage || 0;
    this.pageSize = props.pageSize || 25;
    this.numResults = props.numResults || 0;
  }

}

export class Filter {
  page: number = 0;
  size: number = 25;
  constructor(props?) {
    props = props || {};
    this.page = props.page || 0;
    this.size = props.size || 25;
  }
}

export class RequestSetFilter extends Filter {
  appId: string;
  attackId: string;
  ip: string;
  target: string;
  prediction: string;
  feedback: string;
  submit: boolean;
  start: string;
  stop: string;

  file: FileList = null;

  constructor(props?) {
    super();
    props = props || {};
    this.appId = props.appId || '';
    this.attackId = props.attackId || '';
    this.ip = props.ip || '';
    this.target = props.target || '';
    this.prediction = props.prediction || '';
    this.feedback = props.feedback || '';
    this.submit = props.submit || true;
    this.start = props.start || '';
    this.stop = props.stop || '';
    this.file = props.file || null;
  }
}

export enum StatusColor {
  running = 'green',
  exited = 'red',
  unknown = 'grey',
}

export enum StatusEnum {
  running = 'running',
  exited = 'exited',
  unknown = '',
}

export class Status {
  description: string;
  lastUpdatedAt: string;
  color: StatusColor;
  constructor(options?: any) {
    options = JSONCamelCase.convert(options) || {};
    this.description = options.description || '<no description>';
    this.lastUpdatedAt = options.lastUpdatedAt || new Date();
    this.color = StatusColor[options.description];
  }
}

export class DockerComponent {
  containerName: string;
  serviceName: string;
  description: string;
  status: Status;
  stateDetails: any;
  constructor(options?: any) {
    options = JSONCamelCase.convert(options) || {};
    this.containerName = options.name || '<na>';
    this.serviceName = options.serviceName || '<na>';
    this.status = new Status({description: options.status}) ||
      new Status({description: 'unknown'});
    this.description = this.getDescription();
    this.stateDetails = options.stateDetails || {};
  }
  getDescription(): string {
    const isHas = this.status.description === 'running' ? 'is' : 'has';
    return `${this.containerName} (${this.serviceName}) ${isHas} ${this.status.description}`;
  }
  isRunning(): boolean {
    return this.status.description === StatusEnum.running;
  }
}


export class Pipeline {
  name: string;
  description: string;
  status: Status;
  constructor(options?: any) {
    options = JSONCamelCase.convert(options) || {};
    this.name = options.name || '<na>';
    this.description = options.description || '<no description>';
    this.status = new Status({description: options.status}) ||
      new Status({description: 'unknown'});
  }
}

export enum FeedbackContextTypeEnum {
  attack = 'attack',
  false_positive = 'false positive',
  false_negative = 'false negative',
  true_positive = 'true positive',
  true_negative = 'true negative',
  other = 'other'
}

export class FeedbackContextVM {
  feedbackContexts: Array<FeedbackContext>;
  feedbackContextType: FeedbackContextTypeEnum;
  feedbackContextTypeToDescr: object;
  idToFc: object = {};
  constructor(options?: any) {
    options = JSONCamelCase.convert(options) || {};
    console.info(options)
    this.feedbackContexts = options.feedbackContexts || [];
    this.feedbackContextType = options.feedbackContextType || FeedbackContextTypeEnum.attack;
    this.feedbackContextTypeToDescr = options.feedbackContextTypeToDescr || {};
    this.setIdToFc()
  }
  setIdToFc(): void {
    for (let i = 0; i < this.feedbackContexts.length; i++) {
      const fc = this.feedbackContexts[i];
      this.idToFc[fc.id] = fc;
    }
  }
}

export class FeedbackContext {
  id: number;
  reason: FeedbackContextTypeEnum;
  reasonDescr: string;
  start: Date;
  stop: Date;
  ipCount: number;
  notes: string;
  progressReport: string;
  pending: boolean;

  constructor(options?: any) {
    options = JSONCamelCase.convert(options) || {};
    this.id = options.id;
    this.reason = options.reason || null;
    this.start = options.start || null;
    this.stop = options.stop || null;
    this.ipCount = options.ipCount || null;
    this.notes = options.notes || '';
    this.progressReport = options.progressReport || '';
    this.pending = options.pending || '';
  }
}

