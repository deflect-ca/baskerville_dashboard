import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {BaskervilleService} from '../_services/baskerville.service';
import {validFileSize} from '../_models/helpers';
import {environment} from '../../environments/environment';
import {Envelop, NotificationType} from '../_models/models';
import {NotificationService} from '../_services/notification.service';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../_services/user.service';
import {MatStepper} from '@angular/material/stepper';
import {UploadComponent} from '../upload/upload.component';
import {NotificationsComponent} from '../notifications/notifications.component';
import {LogsComponent} from '../logs/logs.component';
import {ResultsComponent} from '../results/results.component';

@Component({
  selector: 'app-try-baskerville',
  templateUrl: './try-baskerville.component.html',
  styleUrls: ['./try-baskerville.component.css'],
})
export class TryBaskervilleComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepper: MatStepper;
  inProgress = false;
  activeAppId = null;
  selectedFileName = null;
  uploadResults: Envelop = null;
  error: string = null;
  browserRefresh = false;
  uploadFileFormGroup: FormGroup;
  getLogsFormGroup: FormGroup;
  stepToFragment = {
    upload: 0,
    logs: 1,
    results: 2,
  };
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService,
    private userSvc: UserService,
    private formBuilder: FormBuilder
  ) {
    this.activeAppId = this.baskervilleSvc.activeAppId;
  }

  ngOnInit(): void {
    this.uploadFileFormGroup = this.formBuilder.group({
      fileInput: ['', Validators.required],
    });
    this.getLogsFormGroup = this.formBuilder.group({
      secondCtrl: ['', Validators.required]
    });
    this.router.events
      .pipe(filter((rs): rs is NavigationEnd => rs instanceof NavigationEnd))
      .subscribe(event => {
        const e = event as any;
        if (
          e.id === 1 &&
          e.url === e.urlAfterRedirects
        ) {
          this.browserRefresh = true;
        }

      });
    if (!this.browserRefresh) {
      // this.setMessageComm();
    }
    this.setNotificationsForAppId();
    this.baskervilleSvc.setInProgress(this.baskervilleSvc.getActiveAppId());
  }
  ngAfterViewInit(): void {
    if (this.activeAppId) {
      this.baskervilleSvc.getAppStatus().subscribe(
        d => {
          const running = d.data?.running === true;
          this.baskervilleSvc.setInProgress(running);
          this.notificationSvc.showSnackBar(`App ${this.baskervilleSvc.activeAppId} is currently ${running ? '' : 'NOT'} running`);
          },
        e => {
          this.baskervilleSvc.setInProgress(false);
        }
      );
    }
    this.route.fragment.subscribe(
      (fragments) => {
        fragments = fragments || 'upload';
        this.stepper.selectedIndex = this.stepToFragment[fragments];
      }
    );
  }
  cancelRun(): void {
    this.baskervilleSvc.cancelRun().subscribe(
      (data: Envelop) => {
        this.notificationSvc.showSnackBar(data.message);
      },
      error => {
        console.error(error);
        this.notificationSvc.showSnackBar(error.msg);
      }
    );
  }
  setNotificationsForAppId(): void {
    this.activeAppId = this.baskervilleSvc.getActiveAppId();
    if (this.activeAppId) {
      this.notificationSvc.getAppLog(this.userSvc.getUser()?.uuid).subscribe(
        d => {
          this.notificationSvc.addNotification(
            d,
            d.indexOf('ERROR') > -1 ? NotificationType.error : NotificationType.basic
          );
          this.handleEndMessage(d);
        },
        e => console.error(e)
      );
    }
  }
  handleEndMessage(d): void {
    const lowerD = d.toLowerCase();
    if (lowerD.indexOf('goodbye') > -1 || lowerD.indexOf('-end-') > -1){
      console.warn('FOUND END~!!');
      this.notificationSvc.addNotification(
        'You can see your results ',
        NotificationType.success,
        this.activeAppId
      );
      this.baskervilleSvc.setInProgress(false);
    }
  }
  setMessageComm(): void {
    this.notificationSvc.getMessage().subscribe(
      d => {
        this.notificationSvc.addNotification(d, NotificationType.basic);
      },
      e => console.error(e)
    );
  }
  handleFileInput(files: FileList): any {

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
        this.selectedFileName = this.uploadResults.data.filename;
        this.notificationSvc.showSnackBar(this.uploadResults.message);
      },
      error1 => {
        this.notificationSvc.showSnackBar(error1.message, NotificationType.error);
        console.error(error1);
        this.error = error1.message;
      });
  }
  startBaskerville(stepper: MatStepper): any{
    // stepper.next();
    this.baskervilleSvc.tryBaskerville(this.userSvc.getUser().uuid, this.selectedFileName).subscribe(
      d => {
        const results = d as Envelop;
        this.baskervilleSvc.setActiveAppId(results.data.app_id, true);
        this.baskervilleSvc.setInProgress(results.data.app_id !== null);
        this.activeAppId = this.baskervilleSvc.activeAppId;
        //
        this.notificationSvc.addNotification(results.message, NotificationType.success);
        this.notificationSvc.sendToSelf(this.activeAppId, 'Starting Baskerville...');
        this.setNotificationsForAppId();
      },
      e => {
        this.notificationSvc.addNotification(e.message, NotificationType.error);
        this.notificationSvc.addNotification(e.error.message, NotificationType.error);
        console.error(e);
      }
    );
  }
  setInProgress(): void {
    this.baskervilleSvc.setInProgress(!this.baskervilleSvc.inProgress);
    this.inProgress = this.baskervilleSvc.inProgress;
    console.warn('this.inProgressSvc.inProgress', this.baskervilleSvc.inProgress);
  }
}
