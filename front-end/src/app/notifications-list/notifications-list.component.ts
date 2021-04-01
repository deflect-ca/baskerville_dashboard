import { Component, OnInit } from '@angular/core';
import {NotificationService} from '../_services/notification.service';
import {Envelop, Notification} from '../_models/models';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.css']
})
export class NotificationsListComponent implements OnInit {
  notificationsList: Array<Notification>;

  constructor(private notificationSvc: NotificationService) {
    this.notificationsList = [];
  }

  ngOnInit(): void {
    this.notificationSvc.loadAllMessages().subscribe(
      d => {
        console.log(d);
        const data = (d as Envelop);
        this.notificationSvc.showSnackBar(data.message);
        for (let i of data.data) {
          this.notificationsList.push(new Notification(i));
        }
      },
      e => {}
    );
  }

}
