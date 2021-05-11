import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {BaskervilleService} from '../_services/baskerville.service';
import {BotToLabels, Envelop, RequestSetFilter, NotificationType, RequestSet, Results, UserCategoryEnum} from '../_models/models';
import {NotificationService} from '../_services/notification.service';
import {ActivatedRoute} from '@angular/router';
import {FormControl, FormGroup} from '@angular/forms';
import {UserService} from '../_services/user.service';
import {validFileSize} from '../_models/helpers';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit, AfterViewInit{
  @Input() feedbackContextId: number;
  name = 'results';
  envelop: Envelop = null;
  rsFilter: RequestSetFilter;
  tryBaskerville = false;
  currentId = '';
  error = '';
  reSubmitSearch = true;
  attackPanel = false;
  inProgress = false;
  selectedFile = null;
  results: Array<RequestSet> = [];
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });

  constructor(
    private baskervilleSvc: BaskervilleService,
    private userSvc: UserService,
    private notificationSvc: NotificationService,
    private activatedRoute: ActivatedRoute,
    ) {
    this.rsFilter = new RequestSetFilter();
    this.error = '';
    this.reSubmitSearch = this.baskervilleSvc.reSubmitSearch;
  }

  ngOnInit(): void {
    this.error = '';
    this.activatedRoute.url.subscribe(
      d => {
        console.log(d);
        this.tryBaskerville = d[0].path.includes('try-baskerville');
      },
      e => {
        console.error(e);
        this.tryBaskerville = false;
      }
    );
    this.activatedRoute.paramMap.subscribe(params => {
      this.currentId = params.get('id');
      this.rsFilter.appId = this.currentId; // todo: needs safeguarding
    });
    this.rsFilter.appId = this.baskervilleSvc.activeAppId;
    this.feedbackContextId = this.baskervilleSvc.selectedFeedback?.id;
    this.reSubmitSearch = this.baskervilleSvc.reSubmitSearch;
  }
  ngAfterViewInit(): void {
    this.error = '';
    this.reSubmitSearch = this.baskervilleSvc.reSubmitSearch;
    if (this.currentId){
      this.submit();
    }
  }
  checkForContextErrors(): void {
    if (!this.tryBaskerville) {
      this.error = this.baskervilleSvc.checkForSelectedFeedbackErrors();
      if (this.error) return;
      this.error = '';
    }
  }
  submit(): void {
    this.reSubmitSearch = this.baskervilleSvc.reSubmitSearch;
    this.checkForContextErrors();
    this.baskervilleSvc.inProgress = true;
    this.rsFilter = this.prepareFilter();
    this.baskervilleSvc.getResults(
      this.currentId,
      this.rsFilter,
      this.baskervilleSvc.selectedFeedback?.id
    ).subscribe(
      d => {
        this.envelop = d as Envelop;
        this.notificationSvc.showSnackBar(this.envelop.message);
        this.baskervilleSvc.resultsBehaviorSubj.next(new Results(this.envelop.data));
        this.baskervilleSvc.inProgress = false;
        this.baskervilleSvc.reSubmitSearch = false;
        this.reSubmitSearch = this.baskervilleSvc.reSubmitSearch;
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
        this.baskervilleSvc.inProgress = false;
      }
    );
  }
  submitFeedback(): void {
    this.baskervilleSvc.inProgress = true;
    this.rsFilter = this.prepareFilter();
    this.baskervilleSvc.submitFeedback(this.rsFilter).subscribe(
      d => {
        this.envelop = d as Envelop;
        this.notificationSvc.showSnackBar(this.envelop.message);
        this.baskervilleSvc.resultsBehaviorSubj.next(new Results(this.envelop.data));
        this.baskervilleSvc.inProgress = false;
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
        this.baskervilleSvc.inProgress = false;
      }
    );
  }
  getResults(): any {
    this.baskervilleSvc.inProgress = true;
    this.rsFilter = this.prepareFilter();
    this.baskervilleSvc.getResults(this.currentId, this.rsFilter, this.baskervilleSvc.selectedFeedback?.id).subscribe(
      d => {
        this.envelop = d as Envelop;
        this.notificationSvc.showSnackBar(this.envelop.message);
        this.baskervilleSvc.resultsBehaviorSubj.next(new Results(this.envelop.data));
        this.baskervilleSvc.inProgress = false;
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
        this.baskervilleSvc.inProgress = false;
        console.error(e);
      }
    );
  }
  prepareFilter(): RequestSetFilter {
    this.rsFilter.start = this.range.controls.start.value?.toLocaleDateString();
    this.rsFilter.stop = this.range.controls.end.value?.toLocaleDateString();
    this.rsFilter.prediction = BotToLabels[this.rsFilter.prediction];
    return this.rsFilter;
  }
  userIsGuest(): boolean {
    return this.userSvc.getUser().category === UserCategoryEnum.guest;
  }
  handleFileInput(files: FileList): void {

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
    this.baskervilleSvc.uploadCsv(files).subscribe(data => {
        const env = data as Envelop;
        this.rsFilter.file = env.data.filename;
        this.notificationSvc.showSnackBar(env.message);
      },
      error1 => {
        this.notificationSvc.showSnackBar(error1.message, NotificationType.error);
        console.error(error1);
        this.error = error1.message;
      });
  }
}

