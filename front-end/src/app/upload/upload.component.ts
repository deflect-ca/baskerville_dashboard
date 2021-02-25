import { Component, OnInit } from '@angular/core';
import {validFileSize} from '../_models/helpers';
import {environment} from '../../environments/environment';
import {Envelop, NotificationType} from '../_models/models';
import {ActivatedRoute, Router} from '@angular/router';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';
import {UserService} from '../_services/user.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  activeAppId = null;
  error: string = null;
  uploadResults: Envelop = null;
  inProgress = false;
  selectedFileName = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService,
    private userSvc: UserService) { }

  ngOnInit(): void {
  }
  handleFileInput(files: FileList): any {
    console.log(files);

    if (!files || files.length === 0) {
      this.error = 'No file selected.';
      this.notificationSvc.showSnackBar(this.error);
      return;
    }
    if (!validFileSize(files[0])){
      this.error = `File is too big. Max allowed size is ${environment.maxFileSize} MB`;
      this.notificationSvc.showSnackBar(this.error);
      return;
    }
    this.inProgress = true;
    this.error = null;
    this.baskervilleSvc.uploadLogs(files).subscribe(data => {
        this.uploadResults = data as Envelop;
        console.log(this.uploadResults);
        this.selectedFileName = this.uploadResults.data.filename;
        this.notificationSvc.showSnackBar(this.uploadResults.message);
      },
      e => {
        this.notificationSvc.showSnackBar(e.message, NotificationType.error);
        console.error(e);
        this.error = e.message;
      });
  }
  uploadTempLogs(): void {
    this.baskervilleSvc.uploadTempLogs().subscribe(
      data => {this.uploadResults = data as Envelop;
               console.log(this.uploadResults);
               this.selectedFileName = this.uploadResults.data.filename;
               this.notificationSvc.showSnackBar(this.uploadResults.message);
        },
      e => {
        this.notificationSvc.showSnackBar(e.message, NotificationType.error);
        console.error(e);
        this.error = e.message;
      },
    );
  }
  startBaskerville(): any{
    // stepper.next();
    this.notificationSvc.showSnackBar(this.selectedFileName);
    this.baskervilleSvc.tryBaskerville(this.userSvc.getUser().uuid, this.selectedFileName).subscribe(
      d => {
        const results = d as Envelop;
        this.baskervilleSvc.setActiveAppId(results.data.app_id, true);
        this.baskervilleSvc.setInProgress(results.data.app_id !== null);
        this.activeAppId = this.baskervilleSvc.activeAppId;
        //
        this.notificationSvc.addNotification(results.message, NotificationType.success);
        this.notificationSvc.sendToSelf(this.activeAppId, 'Starting Baskerville...');
        this.router.navigate(['try-baskerville', this.activeAppId]);
        // this.setNotificationsForAppId();
      },
      e => {
        this.notificationSvc.addNotification(e.message, NotificationType.error);
        this.notificationSvc.addNotification(e.error.message, NotificationType.error);
        console.error(e);
      }
    );
  }
}
