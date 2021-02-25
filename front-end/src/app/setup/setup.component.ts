import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {first} from 'rxjs/operators';
import {Envelop, NotificationType, User} from '../_models/models';
import {AuthService} from '../_services/auth/auth.service';
import {UserService} from '../_services/user.service';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {
  setupForm: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;
  error = '';
  constructor(
    private formBuilder: FormBuilder,
    private authSvc: AuthService,
    private userSvc: UserService,
    private notificationSvc: NotificationService
    ) { }

  ngOnInit(): void {
    this.setupForm = this.formBuilder.group({
      orgUUID: [this.user.uuid, Validators.required],
      baskervilleHost: ['', Validators.required]
    });
  }
  get user(): User {return this.userSvc.getUser(); }
  // convenience getter for easy access to form fields
  get f(): any { return this.setupForm.controls; }
  onSubmit(): void{
    this.submitted = true;

    // stop here if form is invalid
    if (this.setupForm.invalid) {
      return;
    }

    this.loading = true;
    this.authSvc.setUpOrg(this.f.orgUUID.value, this.f.baskervilleHost.value)
      .pipe(first())
      .subscribe(
        data => {
          if (data.success) {
            console.log('data', data);
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
  getStatusMessage(): string {
    const notOrBlank = this.user.registered ? '' : 'not ';
    return `${this.user.uuid} is ${notOrBlank}registered`;
  }
}
