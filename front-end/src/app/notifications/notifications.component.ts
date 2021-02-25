import { Component, OnInit } from '@angular/core';
import {Notification} from '../_models/models';
import {NotificationService} from '../_services/notification.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {SafeHtmlPipe} from '../safe-html.pipe';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  constructor(
    private notificationSvc: NotificationService,
    private sanitizer: DomSanitizer
  ) {
    console.log('Notifications', this.notifications());
  }
  currentNotification(): Notification{
    return this.notificationSvc.currentNotification;
  }
  notifications(): Array<Notification> {
    return this.notificationSvc.notifications;
  }
  showSnackBar(message: string, action: string): void {
    this.notificationSvc.showSnackBar(message, action);
  }
  ngOnInit(): void {
  }
  getInnerHtml(notification): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(notification.innerHtml);
  }
}
