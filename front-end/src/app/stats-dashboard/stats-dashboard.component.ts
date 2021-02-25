import {Component, OnInit} from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import {Envelop} from '../_models/models';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-stats-dashboard',
  templateUrl: './stats-dashboard.component.html',
  styleUrls: ['./stats-dashboard.component.css']
})
export class StatsDashboardComponent implements OnInit {
  /** Based on the screen size, switch from standard to one column per row */
  allAppsDetails: Envelop = null;
  stats = null;
  cardTemplate = [
    { title: 'Baskerville Database Stats', cols: 1, rows: 1, details: {} },
    { title: 'Card 2', cols: 1, rows: 1, details: {}  }
    ];
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      const data = this.cardTemplate;
      if (matches) {

        data[0].cols = 2;
        data[1].cols = 2;

        data[0].rows = 2;
        data[1].rows = 2;

        return data;
      }
      data[0].cols = 1;
      data[1].cols = 1;

      data[0].cols = 2;
      data[1].cols = 2;

      data[0].rows = 2;
      data[1].rows = 2;

      return data;
    })
  );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService) {}

  ngOnInit(): void {
    this.baskervilleSvc.getAllAppDetails().subscribe(data => {
      this.allAppsDetails = (data as Envelop);
      console.log(data);
      this.updateCards(this.allAppsDetails, 1);
      this.notificationSvc.showSnackBar('App details loaded');
    }, error => {
      this.allAppsDetails = null;
      console.error(error);
    });
    this.baskervilleSvc.getStats().subscribe(data => {
      this.stats = (data as Envelop);
      console.log(data);
      this.updateCards(this.stats, 0);
      this.notificationSvc.showSnackBar('General stats loaded');
    }, error => {
      this.allAppsDetails = null;
      console.error(error);
    });
  }
  updateCards(env: Envelop, i: number): void {
    this.cardTemplate[i].title = env.message;
    this.cardTemplate[i].details = env.data || {};
  }
  isEmptyObject(obj): boolean {
    return (obj && (Object.keys(obj).length === 0));
  }
}
