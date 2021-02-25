import {Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {first} from 'rxjs/operators';
import {Envelop, NotificationType, User} from '../_models/models';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../_services/auth/auth.service';
import {UserService} from '../_services/user.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DOCUMENT} from '@angular/common';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Output() onUserUpdated: EventEmitter<boolean> = new EventEmitter();
  loginForm: FormGroup;
  loading = false;
  loginIsVisible = false;
  submitted = false;
  returnUrl: string;
  error = '';
  htmlSrc: SafeHtml;
  html: string;



  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authSvc: AuthService,
    private userSvc: UserService,
    private domSanitizer: DomSanitizer,
    private notificationSvc: NotificationService,
    @Inject(DOCUMENT) private document: any
  ) {
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['someone@somedomain.com', Validators.required],
      password: ['secret', Validators.required]
    });

    // reset login status
    this.authSvc.logout();

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
  }

  // convenience getter for easy access to form fields
  get f(): any { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authSvc.login(this.f.username.value, this.f.password.value)
      .pipe(first())
      .subscribe(
        data => {
          if (data.success) {
            this.authSvc.setSession(data.data);
            console.log('data', data);
            this.userSvc.setUser(new User(data.data));

            this.notificationSvc.registerToUserSocket(this.userSvc.getUser().uuid).subscribe(
              d => {
                d = d as Envelop;
                this.notificationSvc.addNotification(d.message, NotificationType.basic);
              },
              e => {}
            );
            this.router.navigate([this.returnUrl]);
          } else {
            this.error = data.message;
            this.loading = false;
          }
        },
        error => {
          console.error(error);
          this.error = error.error;
          this.loading = false;
        });
  }
  userExists(): boolean {
    return this.userSvc.getUser() != null;
  }

  continueAsGuest(): void {
    this.authSvc.continueAsGuest().subscribe(
      d => {
        const env = d as Envelop;
        if (env.success) {
          this.authSvc.setSession(env.data);
          console.log('env', env);

          this.userSvc.setUser(new User(env.data));
          this.router.navigate([this.returnUrl]);
        } else {
          this.error = env.message;
          this.loading = false;
        }
        this.notificationSvc.showSnackBar(env.message);
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
      },
    );
  }
}
