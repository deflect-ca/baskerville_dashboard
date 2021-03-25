import { Injectable } from '@angular/core';
import {Envelop, Notification, NotificationType} from '../_models/models';
import {map} from 'rxjs/operators';
import {Socket} from 'ngx-socket-io';
import {MatSnackBar} from '@angular/material/snack-bar';
import {environment} from '../../environments/environment';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {UserService} from './user.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class MainSocket extends Socket {

  constructor() {
    super({ url: environment.socketUrl, options: {transports: ['websocket']} });
  }

}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications: Array<Notification> = [];
  currentNotification: Notification;
  registeredToUserSocket = false;
  registeredAppToUser = {};

  constructor(
    private socket: MainSocket,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private userSvc: UserService,
    private http: HttpClient
    ) {
      this.loadNotifications();
      if (this.notifications.length === 0) {
        this.addNotification('', NotificationType.basic);
      }
  }
  loadAllNotifications(): Observable<object> {
    return this.http.get(environment.baseApiUrl + '/notifications');
  }
  loadNotifications(): void {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    for (const notification of notifications) {
      this.notifications.push(new Notification(notification));
    }
  }
  clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }
  saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }
  addNotification(message: string, kind: any, url?: string): void {
    this.currentNotification = new Notification({message, kind, url});
    this.notifications.unshift(this.currentNotification);
    this.saveNotifications();
  }
  resetAll(): void {
    this.currentNotification = null;
    this.notifications = [];
  }
  registerToUserSocket(uuid: string): any {
    this.socket.emit('register-user', this.userSvc.getUser().uuid);
    this.registeredToUserSocket = true;
    return this.socket.fromEvent(uuid)
      .pipe(map( (data: any) => data ));

  }
  sendMessage(msg: string): void {
    this.socket.emit('message', msg);
  }
  register(uuid): void {
    this.socket.emit('register', uuid);
  }
  sendToSelf(id: string, msg: string): void {
    this.socket.emit(id, msg);
  }
  sendAppId(appId: string): void {
    this.socket.emit('app-status', appId);
  }
  getUserMessage(uuid): any {
    return this.socket
      .fromEvent(uuid)
      .pipe(map( (data: any) => data ));
  }
  getMessage(): any {
    return this.socket
      .fromEvent('message')
      .pipe(map( (data: any) => data ));
  }
  getAppLog(uuid: string): any {
    this.registeredAppToUser[uuid] = true;
    return this.socket.fromEvent(uuid)
      .pipe(map( (data: any) => data ));
  }
  registerUUID(uuid: string): any {
    this.registeredAppToUser[uuid] = true;
    return this.socket.fromEvent(uuid)
      .pipe(map( (data: any) => data ));
  }
  showSnackBar(message: string, action?: string, duration?: number): void {
    duration = duration  || 2800;
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}

