import { Component, OnInit } from '@angular/core';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';
import {Envelop} from '../_models/models';

@Component({
  selector: 'app-app-status',
  templateUrl: './app-status.component.html',
  styleUrls: ['./app-status.component.css']
})
export class AppStatusComponent implements OnInit {
  statusOK = false;
  retry = 150;
  interval: any;
  timeLeft = 5;
  activeAppId = '';
  constructor(
    protected baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService
  ) {

  }

  ngOnInit(): void {
    this.getAppStatus();
    this.getActiveAppId();
  }
  getAppStatus(): void {
    if (this.baskervilleSvc.getActiveAppId()){
      this.baskervilleSvc.getAppStatus().subscribe(
        d => {
          d = (d as Envelop);
          this.statusOK = d.data !== null && d.running === true;
          this.baskervilleSvc.setInProgress(this.statusOK);
          this.notificationSvc.showSnackBar(d.message);
        },
        e => {
          console.error(e);
          this.statusOK = false;
          this.baskervilleSvc.setInProgress(this.statusOK);
          this.notificationSvc.showSnackBar(e.message);
        }
      );
    }
  }
  startTimer(): void {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.getAppStatus();
        this.timeLeft = this.statusOK ? this.retry * 2 : this.retry;
      }
    }, this.retry);
  }
  getAppStatusMessage(): string {
    return this.statusOK ? 'Application exists and is active' : 'Application is not active or does not exist anymore';
  }
  getActiveAppId(): void {
    this.activeAppId = this.baskervilleSvc.getActiveAppId();
  }
}

