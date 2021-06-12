import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {FeedbackContext, FeedbackContextTypeEnum, FeedbackContextVM, FeedbackStepEnum} from '../_models/models';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-feedback-context',
  templateUrl: './feedback-context.component.html',
  styleUrls: ['./feedback-context.component.css']
})
export class FeedbackContextComponent implements OnInit {
  @Input() feedbackContextVM: FeedbackContextVM;
  @Output() created = new EventEmitter<boolean>();
  contextFormGroup: FormGroup;
  range: FormGroup;
  reasons = FeedbackContextTypeEnum;
  selectedReason: FeedbackContextTypeEnum.attack;
  selectedDescription = '';
  constructor(
    private formBuilder: FormBuilder,
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService
  ) {
  }

  ngOnInit(): void {
    this.feedbackContextVM = this.feedbackContextVM || new FeedbackContextVM({});
    this.range = new FormGroup({
      start: new FormControl(),
      stop: new FormControl()
    });
    this.contextFormGroup = this.formBuilder.group({
      firstCtrl: ['', ],
      reason: [this.selectedReason, Validators.required],
      reasonDescr: [this.selectedDescription, Validators.required],
      start: [new Date(), Validators.required],
      stop: [new Date(), Validators.required],
      notes: ['', ],
    });
  }
  reasonChange(e): void {
    this.selectedReason = this.reasons[this.contextFormGroup.controls.reason.value.replace(' ', '_')];
    this.selectedDescription = this.feedbackContextVM.feedbackContextTypeToDescr[this.selectedReason];
  }
  submit(): void {
    const c = this.contextFormGroup.controls;
    const data = {
      reason: this.selectedReason.replace(' ', '_'),
      reasonDescr: this.selectedDescription,
      start: c.start.value?.toLocaleDateString(),
      stop: c.stop.value?.toLocaleDateString(),
      notes: c.notes.value,
    };
    this.baskervilleSvc.setFeedbackContent(data).subscribe(
      d => {
        this.baskervilleSvc.selectedFeedback = new FeedbackContext(d.data);
        this.created.emit(true);
        this.notificationSvc.showSnackBar(d.message);
      },
      e => {
        console.error(e);
      }
    );
  }
}
