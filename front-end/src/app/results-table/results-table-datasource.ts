import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, of as observableOf, merge } from 'rxjs';
import {BaskervilleService} from '../_services/baskerville.service';
import {Envelop, RequestSetFilter, RequestSet} from '../_models/models';
import {MatSelect} from '@angular/material/select';

/**
 * Data source for the ResultsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class ResultsTableDataSource extends DataSource<RequestSet> {
  data: RequestSet[] = []; // EXAMPLE_DATA;
  paginator: MatPaginator;
  selection: MatSelect;
  sort: MatSort;
  numPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 25;
  numResults: number = 0;
  filter: RequestSetFilter;

  constructor() {
    super();
  }
  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<RequestSet[]> {
    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      observableOf(this.data),
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.data]));
    }));
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {}

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: RequestSet[]): RequestSet[] {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: RequestSet[]): RequestSet[] {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'id':
        case 'numRequests':
        case 'prediction':
        case 'score':
          return compare(+a[this.sort.active], +b[this.sort.active], isAsc);
        case 'target':
        case 'ip':
        case 'start':
        case 'stop':
        case 'targetOriginal':
          return compare(a[this.sort.active], b[this.sort.active], isAsc);
        default: return 0;
      }
    });
  }
}

/** Simple sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a: string | number, b: string | number, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
