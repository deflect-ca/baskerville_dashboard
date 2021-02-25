import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Filter, Labels, RequestSet, User} from '../_models/models';
import {UserService} from '../_services/user.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTable} from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import {UsersTableDataSource} from './usets-table.datasource';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  @Input() filter: Filter;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<RequestSet>;
  pageEvent: PageEvent;
  dataSource: UsersTableDataSource;
  selection: SelectionModel<User>;
  multipleSelectedItems = false;
  benign = Labels.benign;
  malicious = Labels.malicious;
  unsure = Labels.unknown;
  allSelected = false;
  allInQSelected = false;
  users: Array<User> = [];
  displayedColumns: Array<string> = [];
  dataColumns: Array<string> = [];

  constructor(
    private userSvc: UserService,
    private notificationSvc: NotificationService) {
    this.filter = new Filter({});
  }

  ngOnInit(): void {
    this.dataSource = new UsersTableDataSource();
    // this.selection = new SelectionModel<RequestSet>(allowMultiSelect, initialSelection);
    this.setData();
  }
  getUsers(): void {
    this.userSvc.getAllUsers().subscribe(
      data => {
        this.userSvc.usersBehaviorSubj.next(data);
        },
      e => { console.error(e); },
    );
  }
  setData(): void {
    this.userSvc.usersBehaviorSubj.subscribe(
      data => {
        console.debug(data);
        console.log('resultsBehaviorSubj DATA', data)
        this.displayedColumns = data.data.length > 0 ? Object.keys(data.data[0]) : [];
        this.dataColumns = this.displayedColumns;
        if (this.dataColumns.length > 0){
          this.displayedColumns = this.displayedColumns.concat(['Result', 'Feedback']);
          this.displayedColumns.unshift('Select');
          // this.displayedColumns.splice(this.displayedColumns.indexOf('feedback'), 1);
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
    this.filter.size = e.pageSize;
    this.filter.page = e.pageIndex;
    this.getUsers();
    this.dataSource.paginator.pageIndex = e.previousPageIndex;
    this.dataSource.currentPage = e.previousPageIndex;
    this.dataSource.pageSize = e.pageSize;
    this.dataSource.numPages = Math.ceil(e.pageSize / this.dataSource.numResults);
  }
}
