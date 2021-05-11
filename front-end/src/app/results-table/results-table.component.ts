import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { ResultsTableDataSource} from './results-table-datasource';
import {BaskervilleService} from '../_services/baskerville.service';
import {
  BotNotBotEnum,
  Envelop,
  FeedbackEnum,
  FeedbackReversedEnum,
  Labels,
  RequestSet,
  RequestSetFilter,
  Results
} from '../_models/models';
import {NotificationService} from '../_services/notification.service';
import {SelectionModel} from '@angular/cdk/collections';
import {ActivatedRoute, Router} from '@angular/router';

const initialSelection = [];
const allowMultiSelect = true;

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.css']
})
export class ResultsTableComponent implements AfterViewInit, OnInit {
  @Input() rsFilter: RequestSetFilter;
  @Input() feedbackContextId: number;
  @Output() created = new EventEmitter<boolean>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<RequestSet>;
  pageEvent: PageEvent;
  dataSource: ResultsTableDataSource;
  selection: SelectionModel<RequestSet>;
  multipleSelectedItems = false;
  benign = Labels.benign;
  malicious = Labels.malicious;
  unsure = Labels.unknown;
  allSelected = false;
  allInQSelected = false;
  resultsFeedback = false;
  error = '';
  tryBaskerville = false;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = [];
  dataColumns = [];

  constructor(
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute
    ) {}

  ngOnInit(): void {
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
    this.resultsFeedback = this.router.url === '/feedback';
    this.dataSource = new ResultsTableDataSource();
    this.selection = new SelectionModel<RequestSet>(allowMultiSelect, initialSelection);
    this.setData();
  }
  setData(): void {
    this.baskervilleSvc.resultsBehaviorSubj.subscribe(
      data => {
        this.allSelected = false;
        let rightCols = ['Result'];
        if (this.resultsFeedback) {
          rightCols.push('Feedback');
        }
        this.displayedColumns = data.data.length > 0 ? Object.keys(data.data[0]) : [];
        this.dataColumns = this.displayedColumns;
        if (this.dataColumns.length > 0){
          this.dataColumns.splice(this.dataColumns.indexOf('feedback'), 1);
          this.dataColumns.splice(this.dataColumns.indexOf('lowRateFeedback'), 1);
          this.displayedColumns = this.displayedColumns.concat(rightCols);
          this.displayedColumns.unshift('Select');
        }
        this.dataSource.data = data.data as any;
        this.dataSource.pageSize = data.pageSize || 50;
        this.dataSource.numPages = data.numPages || 0;
        this.dataSource.numResults = data.numResults || 0;
        this.dataSource.currentPage = data.currentPage || 0;
        this.notificationSvc.showSnackBar(`Loaded ${this.dataSource.data.length} out of ${this.dataSource.numResults} results.`);
      },
      error => {
        this.notificationSvc.showSnackBar(error);
      },
    );
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }
  toggle(row): void{
    row.isSelected = this.allSelected? this.allSelected : !row.isSelected;
    this.multipleSelected();
  }
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  multipleSelected(): boolean {
    let numSelected = 0;
    this.dataSource.data.forEach(row => {
      numSelected += +row.isSelected || 0;
      if (numSelected > 1) return;
    });
    this.multipleSelectedItems = numSelected > 1;
    // console.warn('this.multipleSelectedItems', this.multipleSelectedItems, numSelected)
    return this.multipleSelectedItems;
  }
  handleCheckboxChange(event): void {
    console.info('handleCheckboxChange')
    console.warn(event);
    if (event) {
      this.masterToggle();
    }
  }
  masterToggle(): void {
    this.allSelected = !this.allSelected;
    this.dataSource.data.forEach(row => {
      this.toggle(row);
      // this.selection.select(row)
    });
  }
  getSelected(): RequestSet[] {
    const selectedIds = [];
    this.dataSource.data.forEach(rs => {
      if (rs.isSelected) {
        selectedIds.push(rs.id);
      }
    });
    return selectedIds;
  }
  updateSelected(botNotBot, lowRate): RequestSet[] {
    const selectedIds = [];
    this.dataSource.data.forEach(rs => {
      if (rs.isSelected) {
        rs.feedback = botNotBot.toLowerCase();
        rs.lowRate = lowRate;
        rs.lowRateFeedback = lowRate;
      }
    });
    return selectedIds;
  }
  selectAllInQ(): boolean {
    this.allInQSelected = !this.allInQSelected;
    return this.allInQSelected;
  }
  checkForContextErrors(): void {
    if (!this.tryBaskerville) {
      this.error = this.baskervilleSvc.checkForSelectedFeedbackErrors();
      if (this.error) return;
      this.error = '';
    }
  }
  sendBulkPositiveFeedback(): any {
    this.error = this.baskervilleSvc.checkForSelectedFeedbackErrors();
    if (this.error) return;
    const data = this.getSelected();
    this.baskervilleSvc.sendBulkFeedback(FeedbackEnum.correct, data).subscribe(
      d => {
        this.notificationSvc.showSnackBar(d.message);
        this.created.emit(true);
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  sendBulkBotNotBotFeedback(botNotBot: string, lowRate?: boolean): any {
    this.error = this.baskervilleSvc.checkForSelectedFeedbackErrors();
    if (this.error) return;
    const data = {
      rss: this.getSelected(),
      lowRate: lowRate || false
    };
    this.baskervilleSvc.sendBulkFeedback(BotNotBotEnum[botNotBot], data).subscribe(
      d => {
        this.notificationSvc.showSnackBar(d.message);
        this.updateSelected(botNotBot, lowRate);
        this.created.emit(true);
      },
      e => {
        console.error(e);
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  sendBulkNegativeFeedback(): any {
    this.checkForContextErrors();
    const data = this.getSelected();
    this.baskervilleSvc.sendBulkFeedback(FeedbackReversedEnum[FeedbackEnum.incorrect], data).subscribe(
      d => {
        this.notificationSvc.showSnackBar(d.message);
        this.created.emit(true);
      },
      e => {
        console.error(e);
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  sendBulkAttack(): any {
    this.checkForContextErrors();
    const data = this.getSelected();
    this.baskervilleSvc.sendBulkAttack(FeedbackEnum.correct, data).subscribe(
      d => {
        this.notificationSvc.showSnackBar(d.message);
      },
      e => {
        console.error(e);
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  sendPositiveFeedback(row): any {
    this.checkForContextErrors();
    const feedbackStr = 'notbot';  // this.botNotBotToFeedback(row.prediction, 'NOTBOT');
    this.baskervilleSvc.sendFeedback(
      feedbackStr, row.id, this.rsFilter.submit
    ).subscribe(
      d => {
        row.feedback = feedbackStr;
        this.notificationSvc.showSnackBar(d.message);
        this.created.emit(true);
      },
      e => {
        console.error(e);
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  sendNegativeFeedback(row, lowRate?: boolean): any {
    this.checkForContextErrors();
    const feedbackStr = 'bot';  // this.botNotBotToFeedback(row.prediction, 'BOT');
    this.baskervilleSvc.sendFeedback(
      feedbackStr, row.id, lowRate
    ).subscribe(
      d => {
        row.feedback = feedbackStr;
        row.lowRate = lowRate;
        row.lowRateFeedback = lowRate;
        this.notificationSvc.showSnackBar(d.message);
        this.created.emit(true);
      },
      e => {
        console.error(e);
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  sendAttack(row): any {
    this.checkForContextErrors();
    this.baskervilleSvc.sendAttack(row.id).subscribe(
      d => {
        this.notificationSvc.showSnackBar(d.message);
      },
      e => {
        console.error(e);
        this.notificationSvc.showSnackBar(e.message);
      }
    );
  }
  getData(e): any {
    this.checkForContextErrors();
    this.rsFilter.size = e.pageSize;
    this.rsFilter.page = e.pageIndex;
    this.getResults();
    this.dataSource.paginator.pageIndex = e.previousPageIndex;
    this.dataSource.currentPage = e.previousPageIndex;
    this.dataSource.pageSize = e.pageSize;
    this.dataSource.numPages = Math.ceil(e.pageSize / this.dataSource.numResults);
  }
  getResults(): any {
    this.checkForContextErrors();
    this.baskervilleSvc.inProgress = true;
    this.baskervilleSvc.getResults(this.rsFilter.appId, this.rsFilter, this.feedbackContextId).subscribe(
      d => {
        const envelop = d as Envelop;
        console.log(envelop);
        this.notificationSvc.showSnackBar(envelop.message);
        this.baskervilleSvc.resultsBehaviorSubj.next(new Results(envelop.data));
        this.baskervilleSvc.inProgress = false;
        this.allSelected = false;
      },
      e => {
        this.notificationSvc.showSnackBar(e.message);
        this.baskervilleSvc.inProgress = false;
        console.error(e);
      }
    );
  }
  botNotBotToFeedback(prediction, botNotBot): string {
    if (botNotBot === 'NOTBOT') {
      return prediction === this.benign ? FeedbackEnum.correct : FeedbackEnum.incorrect;
    }
    else if (botNotBot === 'BOT') {
      return prediction === this.benign ? FeedbackEnum.incorrect : FeedbackEnum.correct;
    }
    return null;
  }
  feedbackToBotNotBot(row, botNotBot): boolean {
    if (!row.feedback) { return false; }
    if (row.feedback === FeedbackEnum.correct) {
      if (botNotBot === 'BOT') { return row.prediction !== this.unsure; }
      if (botNotBot === 'NOTBOT') { return row.prediction === this.unsure; }
    }
    else if (row.feedback === FeedbackEnum.incorrect) {
      if (botNotBot === 'BOT') { return row.prediction !== this.unsure; }
      if (botNotBot === 'NOTBOT') { return row.prediction === this.unsure; }
    }
    return false;
  }
}

