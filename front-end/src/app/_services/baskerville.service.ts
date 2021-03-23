import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';
import {Envelop, FeedbackContext, Filter, RequestSet, RequestSetFilter, Results} from '../_models/models';
import {UserService} from './user.service';

@Injectable({
  providedIn: 'root'
})
export class BaskervilleService {
  activeAppId: string = null;
  inProgress = false;
  statusOK = false;
  results = new Results();
  appIsActive = false;
  selectedFeedback: FeedbackContext;

  resultsBehaviorSubj = new BehaviorSubject(this.results);
  constructor(
    private http: HttpClient,
    private userSvc: UserService
  ) {
    this.activeAppId = this.getActiveAppId();
    // this.setInProgress(this.activeAppId !== null);
  }

  cancelRun(): Observable<object> {
    return this.http.post(
      environment.baseApiUrl + `/try/app/${this.getActiveAppId()}/cancel`,
      {}
      );
  }
  uploadLogs(files: FileList): Observable<object> {
    const formData: FormData = new FormData();
    formData.append('file',  files[0], files[0].name);
    return this.http.post(environment.baseApiUrl + '/try/upload', formData);
  }
  uploadCsv(files: FileList): Observable<object> {
    const formData: FormData = new FormData();
    formData.append('file',  files[0], files[0].name);
    return this.http.post(environment.baseApiUrl + '/results/upload', formData);
  }
  uploadTempLogs(): Observable<object> {
    return this.http.post(environment.baseApiUrl + '/try/upload/temp', {});
  }
  tryBaskerville(clientUUID: string, filename: string): Observable<object> {
    const data = {
      client_uuid: clientUUID,
      filename,
    };
    return this.http.post(environment.baseApiUrl + '/try', data);
  }
  getActiveAppId(): string {
    this.activeAppId = localStorage.getItem('app-id');
    return this.activeAppId;
  }
  setActiveAppId(id, storage?: boolean): void {
    if (storage) {
      localStorage.setItem('app-id', id);
    }
    this.activeAppId = id;
  }
  clearApp(): void{
    localStorage.removeItem('app-id');
    this.activeAppId = null;
    this.inProgress = false;
  }
  setInProgress(inProgress): void {
    this.inProgress = inProgress;
  }
  getFeedbackContentVM(): Observable<any> {
    return this.http.get(environment.baseApiUrl + `/feedback/context`);
  }
  setFeedbackContent(data): Observable<any> {
    return this.http.post(environment.baseApiUrl + `/feedback/context`, data);
  }
  sumbitToBaskerville(): Observable<any> {
    return this.http.post( environment.baseApiUrl + `/feedback/submit/${this.selectedFeedback.id}`, {});
  }
  getResults(appId, filter?: Filter): any {
    appId = appId || '';
    let url = environment.baseApiUrl + '/results';
    if (appId) {url += `/${appId}`; }
    if (filter) {
      url += this.getFilterQ(filter);
    }
    const data = {
      client_uuid: this.getUserId()
    };
    return this.http.post(url, data);
  }
  getUserId(): string {
    return this.userSvc.getUser().uuid;
  }
  getStats(): any {
    return this.http.get(environment.baseApiUrl + `/stats`);
  }
  getDockerComponents(): any {
    return this.http.get(environment.baseApiUrl + `/components/all`);
  }
  dockerComponentStart(componentName): any {
    return this.http.post(environment.baseApiUrl + `/components/${componentName}/start`, {});
  }
  dockerComponentStop(componentName): any {
    return this.http.post(environment.baseApiUrl + `/components/${componentName}/stop`, {});
  }
  dockerComponentRestart(componentName): any {
    return this.http.post(environment.baseApiUrl + `/components/${componentName}/restart`, {});
  }
  getAppDetails(appId: string): any {
    return this.http.get(environment.baseApiUrl + `/${appId}/details`);
  }
  getAllAppDetails(): any {
    return this.http.get(environment.baseApiUrl + `/app-stats`);
  }
  getStatus(): any {
    return this.http.get(environment.baseApiUrl + `/status`);
  }
  loadConfig(pipelineName: string): any {
    return this.http.get(environment.baseApiUrl + `/pipeline/config/${pipelineName}`);
  }
  retrain(config: string): any {
    const data = {
      config
    };
    return this.http.post(environment.baseApiUrl + '/retrain', data);
  }
  sendFeedback(feedback, rsId, lowRate?): any {
    lowRate = lowRate || false;
    const body = {
      client_uuid: this.getUserId(),
      lowRate
    };
    return this.http.post(
      environment.baseApiUrl + `/feedback/${this.selectedFeedback.id}/${rsId}/${feedback}`, body);
  }
  sendBulkFeedback(feedback, data): any {
    const body = {
      rss: data.rss,
      lowRate: data.lowRate,
      client_uuid: this.getUserId()
    };
    return this.http.post(
      environment.baseApiUrl + `/feedback/${this.selectedFeedback.id}/${feedback}`, body);
  }
  sendBulkBotNotBotFeedback(botNotBot, data): any {
    const body = {
      rss: data,
      client_uuid: this.getUserId()
    };
    return this.http.post(
      environment.baseApiUrl + `/feedback/${botNotBot}`, body);
  }
  sendBulkAttack(feedback, data): any {
    const body = {
      data,
      userId: this.getUserId()
    };
    return this.http.post(
      environment.baseApiUrl + `/attack`, body);
  }
  sendAttack(rsId): any {
    const body = {
      userId: this.getUserId()
    };
    return this.http.post(
      environment.baseApiUrl + `/attack/${rsId}`, body);
  }
  submitFeedback(rsFilter: RequestSetFilter): Observable<any> {
    let url = environment.baseApiUrl + `/feedback/submit`;
    if (rsFilter) {
      url += this.getFilterQ(rsFilter);
    }
    const body = {
      client_uuid: this.getUserId(),
    };
    return this.http.post(
      url, body
    );
  }
  getAppStatus(): any {
    return this.http.get(environment.baseApiUrl + `/app/${this.getActiveAppId()}`);
  }
  setAppStatusOK(status: boolean): void {
    this.statusOK = status;
  }
  getFilterQ(rsFilter: Filter): string {
    let url = '?';
    Object.keys(rsFilter).forEach((key, value) => {
      const v = rsFilter[key];
      if (v){
        url += `${key}=${v}&`;
      }
    });
    return url;
  }
}

