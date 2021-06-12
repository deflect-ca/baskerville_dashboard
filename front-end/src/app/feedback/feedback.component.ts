import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {FeedbackContextVM, FeedbackContextTypeEnum, FeedbackContext, FeedbackStepEnum} from '../_models/models';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';
import {MatStepper} from '@angular/material/stepper';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepper: MatStepper;
  contextFormGroup: FormGroup;
  resultsFormGroup: FormGroup;
  selectedFeedbackContext: FeedbackContext;
  feedbackContextVM: FeedbackContextVM;
  inProgress = false;
  submitted = false;
  error = '';
  constructor(
    private formBuilder: FormBuilder,
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService,
    ) {
    this.feedbackContextVM = new FeedbackContextVM({});
    this.selectedFeedbackContext = null;
  }
  ngOnInit(): void {
    this.setFeedbackContextVM();
    this.contextFormGroup = this.formBuilder.group({
      fc: ['', ],

    });
    this.resultsFormGroup = this.formBuilder.group({
      secondCtrl: ['', Validators.required]
    });
    this.baskervilleSvc.loadFeedbackData();
  }
  ngAfterViewInit(): void {
    this.baskervilleSvc.loadFeedbackData();
    // todo: need to have a single source of truth... this needs refactoring.
    if (this.baskervilleSvc.feedbackData.selectedFeedbackContext) {
      this.baskervilleSvc.selectedFeedback = this.baskervilleSvc.feedbackData.selectedFeedbackContext;
      this.selectedFeedbackContext = this.baskervilleSvc.feedbackData.selectedFeedbackContext;
    }
    this.stepper.selectedIndex = this.baskervilleSvc.feedbackData?.currentStep || FeedbackStepEnum.feedbackContext;
  }
  setFeedbackContextVM(): void {
    this.baskervilleSvc.getFeedbackContentVM().subscribe(
      data => {
        if (data.success) {
          this.feedbackContextVM = new FeedbackContextVM(data.data);
          this.notificationSvc.showSnackBar(data.message);
        }
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  onCreated(success): void {
    if (success){
      this.submitted = false;
      this.selectedFeedbackContext = this.baskervilleSvc.selectedFeedback;
      this.baskervilleSvc.reSubmitSearch = true;
      this.baskervilleSvc.setFeedbackData({
        feedbackContext: this.selectedFeedbackContext,
        currentStep: FeedbackStepEnum.feedback
      });
      this.stepper.next();
    }
  }
  fcChange(e: boolean): void {
    this.submitted = false;
    this.baskervilleSvc.setSelectedFeedback(this.feedbackContextVM.idToFc[this.contextFormGroup.controls.fc.value]);
    this.selectedFeedbackContext = this.baskervilleSvc.selectedFeedback;
    this.baskervilleSvc.reSubmitSearch = true;
    this.baskervilleSvc.setFeedbackData({
      selectedFeedbackContext: this.selectedFeedbackContext,
      currentStep: FeedbackStepEnum.feedback
    });
    this.stepper.next();
  }
  feedbackChange(e: boolean): void {
    this.submitted = false;
    this.inProgress = false;
    this.baskervilleSvc.setFeedbackData({
      selectedFeedbackContext: this.selectedFeedbackContext,
      currentStep: FeedbackStepEnum.feedback
    });
  }
  updateFeedbackData(): void {
    this.baskervilleSvc.setFeedbackData({
      selectedFeedbackContext: this.selectedFeedbackContext,
      currentStep: FeedbackStepEnum.submit
    });
    this.stepper.next();
  }
  submitToBaskerville(): void {
    this.error = this.baskervilleSvc.checkForSelectedFeedbackErrors();
    if (this.error) return;
    this.submitted = true;
    this.inProgress = true;
    this.baskervilleSvc.setInProgress(this.inProgress);
    this.baskervilleSvc.sumbitToBaskerville().subscribe(
      data => {
        this.notificationSvc.showSnackBar(data.message);
        this.submitted = true;
        this.inProgress = false;
        this.baskervilleSvc.setInProgress(this.inProgress);
        this.error = '';
      },
      e => {
        this.notificationSvc.showSnackBar(e.error.message);
        this.error = e.error.message;
        this.submitted = false;
        this.inProgress = false;
        this.baskervilleSvc.setInProgress(this.inProgress);
      }
    );
  }
}

