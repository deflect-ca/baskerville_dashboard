import { Component, OnInit } from '@angular/core';
import {BaskervilleService} from '../_services/baskerville.service';
import {Envelop} from '../_models/models';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  allAppsDetails = null;

  constructor(private baskervilleSvc: BaskervilleService) {

  }

  ngOnInit(): void {
    this.baskervilleSvc.getAllAppDetails().subscribe(data => {
      this.allAppsDetails = (data as Envelop).data;
    }, error => {
      this.allAppsDetails = null;
      console.error(error);
    });
  }

}

