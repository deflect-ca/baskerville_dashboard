import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MessagesDataSource } from './messages-datasource';
import {Envelop, Notification, Results} from '../_models/models';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Notification>;
  pageEvent: PageEvent;
  dataSource: MessagesDataSource;

  displayedColumns: Array<string> = [];
  dataColumns: Array<string> = [];

  constructor(private notificationSvc: NotificationService) {
  }

  ngOnInit(): void {
    this.dataSource = new MessagesDataSource();
    this.getMessages();
  }

  ngAfterViewInit(): void {
    this.setData();
  }
  getMessages(): void {
    this.notificationSvc.loadAllMessages().subscribe(
      d => {
        this.notificationSvc.messagesBehaviorSubj.next(d as Results<Notification>);
        this.notificationSvc.showSnackBar((d as Envelop).message);
      },
      e => {}
    );
  }
  setData(): void {
    this.notificationSvc.messagesBehaviorSubj.subscribe(
      data => {
        console.debug(data);
        this.displayedColumns = data.data.length > 0 ? Object.keys(data.data[0]) : [];
        this.dataColumns = this.displayedColumns;
        if (this.dataColumns.length > 0){
          // this.displayedColumns.splice(this.displayedColumns.indexOf('Select'), 1);
        }
        this.dataSource.data = data.data as any;
        this.dataSource.pageSize = data.pageSize || 50;
        this.dataSource.numPages = data.numPages || 0;
        this.dataSource.numResults = data.numResults || 0;
        this.dataSource.currentPage = data.currentPage || 0;
        this.notificationSvc.showSnackBar(`Loaded ${this.dataSource.data.length} out of ${this.dataSource.numResults} results.`);
      },
      e => { console.error(e); }
    );
  }

  getData(e): any {
    // this.filter.size = e.pageSize;
    // this.filter.page = e.pageIndex;
    // this.getMessages();
    // this.dataSource.paginator.pageIndex = e.previousPageIndex;
    // this.dataSource.currentPage = e.previousPageIndex;
    // this.dataSource.pageSize = e.pageSize;
    // this.dataSource.numPages = Math.ceil(e.pageSize / this.dataSource.numResults);
  }
}
