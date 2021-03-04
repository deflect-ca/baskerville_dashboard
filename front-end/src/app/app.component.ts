import {AfterViewInit, Component, NgModule, ViewChild} from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {BaskervilleService} from './_services/baskerville.service';
import {Envelop} from './_models/models';
import {UserService} from './_services/user.service';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {AuthService} from './_services/auth/auth.service';
import {MatDrawer, MatSidenav, MatSidenavContainer} from '@angular/material/sidenav';
import {NotificationService} from './_services/notification.service';

@NgModule({
  declarations: [],
  imports: [
    MatGridListModule,
  ],
  exports: [MatGridListModule]
})
export class MaterialModule { }


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit{
  @ViewChild('drawer') drawer: MatDrawer;
  title = 'Baskerville Dashboard';
  statusOK = false;
  retry = 200;
  interval: any;
  timeLeft = 20;
  constructor(
    protected baskervilleSvc: BaskervilleService,
    private userSvc: UserService,
    private notificationSvc: NotificationService,
    private authSvc: AuthService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ){
    this.matIconRegistry.addSvgIcon(
      `bot`,
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/icons8-bot-100.png')
    );
    this.getStatus();
    this.startTimer();
  }
  ngAfterViewInit(): void {
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
    const uuid = this.userSvc.getUser().uuid;
    this.notificationSvc.registerUUID(uuid).subscribe(
      d => {this.notificationSvc.showSnackBar(d); },
      e => {this.notificationSvc.showSnackBar(e); }
    );
    // this.notificationSvc.sendToSelf(uuid, 'Welcome - subscribed to notifications ');
  }
  getStatus(): boolean {
    return this.baskervilleSvc.getStatus().subscribe(
      data => {
        data = data as Envelop;
        this.statusOK = data.success == true;
      },
      error => {
        this.statusOK = false;
      }
    );
  }
  startTimer(): void {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.getStatus();
        this.timeLeft = this.statusOK ? this.retry * 3 : this.retry;
      }
    }, this.retry);
  }
  getStatusMessage(): string {
    return this.statusOK ? 'On-line' : 'Off-line. Try again later';
  }
  userExists(): boolean {
    return this.userSvc.getUser() != null;
  }
  userIsGuest(): boolean {
    return this.userSvc.userIsGuest();
  }
  getCurrentUser(): string {
    return this.userSvc.getUser()?.username;
  }
  logout(): void{
    this.baskervilleSvc.clearApp();
    this.authSvc.logout();
    this.notificationSvc.clearNotifications();
  }
  setInProgress(): void {
    this.baskervilleSvc.setInProgress(!this.baskervilleSvc.inProgress);
  }
}
