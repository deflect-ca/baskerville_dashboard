import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TryBaskervilleComponent } from './try-baskerville/try-baskerville.component';
import { ResultsComponent } from './results/results.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { LabelAttacksComponent } from './label-attacks/label-attacks.component';
import { InfoComponent } from './info/info.component';
import { ContactComponent } from './contact/contact.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AdminComponent } from './admin/admin.component';
import { NotificationsComponent } from './notifications/notifications.component';
import {RouterModule, Routes} from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { InProgressComponent } from './in-progress/in-progress.component';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import { StatsComponent } from './stats/stats.component';
import {MatSliderModule} from '@angular/material/slider';
import { ResultsTableComponent } from './results-table/results-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { StatsDashboardComponent } from './stats-dashboard/stats-dashboard.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSelectModule} from '@angular/material/select';
import {MainSocket} from './_services/notification.service';
import { AttacksTableComponent } from './feedback-context-table/attacks-table.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import {SafeHtmlPipe} from './safe-html.pipe';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDatepickerModule, MatDateRangePicker} from '@angular/material/datepicker';
import { LoginComponent } from './login/login.component';
import {MatChipsModule} from '@angular/material/chips';
import { LicenseComponent } from './license/license.component';
import {AuthService} from './_services/auth/auth.service';
import {AuthGuard} from './_services/auth/auth.guard';
import {AuthInterceptor} from './_services/auth/auth-interceptor.service';
import { AppStatusComponent } from './app-status/app-status.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { RunBaskervilleComponent } from './run-baskerville/run-baskerville.component';
import {MatStepperModule} from '@angular/material/stepper';
import { LogsComponent } from './logs/logs.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatBadgeModule} from '@angular/material/badge';
import { UploadComponent } from './upload/upload.component';
import {MatDividerModule} from '@angular/material/divider';
import { TopMenuComponent } from './top-menu/top-menu.component';
import { PipelinesComponent } from './pipelines/pipelines.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { PipelineManagementComponent } from './pipeline-management/pipeline-management.component';
import { ComponentManagementComponent } from './component-management/component-management.component';
import { CodeEditorModule } from '@ngstack/code-editor';
import { RegisterComponent } from './register/register.component';
import { UsersComponent } from './users/users.component';
import { UserComponent } from './user/user.component';
import { TryMenuComponent } from './try-menu/try-menu.component';
import { SetupComponent } from './setup/setup.component';
import { FeedbackContextComponent } from './feedback-context/feedback-context.component';
import { HomeComponent } from './home/home.component';


const socketConfig: SocketIoConfig = { url: 'http://localhost:5000', options: {} };

const appRoutes: Routes = [
  { path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  }, {
    path: 'home',
    component: HomeComponent,
    data: { title: 'Home' },
    canActivate: [AuthGuard]
  }, {
    path: 'try-baskerville',
    component: TryBaskervilleComponent,
    data: { title: 'Try Baskerville' },
    canActivate: [AuthGuard]
  }, {
    path: 'components',
    component: ComponentManagementComponent,
    data: { title: 'Component Management' },
    canActivate: [AuthGuard]
  }, {
    path: 'upload',
    component: UploadComponent,
    data: { title: 'Upload Logs' },
    canActivate: [AuthGuard]
  }, {
    path: 'try-baskerville/:appId',
    component: TryBaskervilleComponent,
    data: { title: 'Try Baskerville' },
    canActivate: [AuthGuard]
  }, {
    path: 'label-attacks',
    component: LabelAttacksComponent,
    data: { title: 'Label Attacks' },
    canActivate: [AuthGuard]
  }, {
    path: 'feedback',
    component: FeedbackComponent,
    data: { title: 'Feedback' },
    canActivate: [AuthGuard]
  }, {
    path: 'results/:id',
    component: ResultsComponent,
    data: { title: 'Results' },
    canActivate: [AuthGuard]
  }, {
    path: 'results',
    component: ResultsComponent,
    data: { title: 'Results' },
    canActivate: [AuthGuard]
  }, {
    path: 'pipelines',
    component: PipelinesComponent,
    data: { title: 'Pipelines' },
    canActivate: [AuthGuard]
  }, {
    path: 'pipelines/:name',
    component: PipelineManagementComponent,
    data: { title: 'Pipeline Management' },
    canActivate: [AuthGuard]
  }, {
    path: 'users',
    component: UsersComponent,
    data: { title: 'Users' },
    canActivate: [AuthGuard]
  }, {
    path: 'user/:id',
    component: UserComponent,
    data: { title: 'User' },
    canActivate: [AuthGuard]
  }, {
    path: 'setup',
    component: SetupComponent,
    data: { title: 'Setup' },
    canActivate: [AuthGuard]
  },  {
    path: 'stats',
    component: StatsComponent,
    data: { title: 'Stats' },
    canActivate: [AuthGuard]
  }, {
    path: 'logs',
    component: LogsComponent,
    data: { title: 'Baskerville Logs' },
    canActivate: [AuthGuard]
  }, {
    path: 'logs/:id',
    component: LogsComponent,
    data: { title: 'Baskerville Logs' },
    canActivate: [AuthGuard]
  }, {
    path: 'register',
    component: RegisterComponent,
    data: { title: 'Register' },
  }, {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' },
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    SafeHtmlPipe,
    TryBaskervilleComponent,
    ResultsComponent,
    FeedbackComponent,
    LabelAttacksComponent,
    InfoComponent,
    ContactComponent,
    AdminComponent,
    NotificationsComponent,
    FooterComponent,
    MainMenuComponent,
    InProgressComponent,
    StatsComponent,
    ResultsTableComponent,
    StatsDashboardComponent,
    AttacksTableComponent,
    PageNotFoundComponent,
    LoginComponent,
    LicenseComponent,
    AppStatusComponent,
    RunBaskervilleComponent,
    LogsComponent,
    UploadComponent,
    TopMenuComponent,
    PipelinesComponent,
    ConfigurationComponent,
    PipelineManagementComponent,
    ComponentManagementComponent,
    RegisterComponent,
    UsersComponent,
    UserComponent,
    TryMenuComponent,
    SetupComponent,
    FeedbackContextComponent,
    HomeComponent,
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false, relativeLinkResolution: 'legacy' } // <-- debugging purposes only
 // <-- debugging purposes only
    ),
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    HttpClientModule,
    SocketIoModule.forRoot(socketConfig),
    MatGridListModule,
    MatDatepickerModule,
    MatCardModule, MatFormFieldModule,
    MatInputModule, MatSliderModule,
    MatTableModule, MatPaginatorModule,
    MatSortModule, MatMenuModule, MatIconModule,
    MatButtonModule, LayoutModule, MatOptionModule,
    MatNativeDateModule, MatSidenavModule,
    MatSnackBarModule, MatSelectModule, MatChipsModule,
    MatProgressBarModule, MatStepperModule, MatBadgeModule, MatDividerModule,
    CodeEditorModule.forRoot()
  ],
  exports: [
    MatProgressBarModule, MatChipsModule, MatDatepickerModule, MatInputModule, MatGridListModule,
    MatSliderModule, BrowserAnimationsModule, SafeHtmlPipe, MatStepperModule, MatSidenavModule, MatBadgeModule
  ],
  providers: [
    { provide: 'BASE_API_URL', useValue: environment.baseApiUrl },
    AuthGuard,
    AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    MainSocket
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
