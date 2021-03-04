import { Component, OnInit } from '@angular/core';
import {BaskervilleService} from '../_services/baskerville.service';

@Component({
  selector: 'app-in-progress',
  templateUrl: './in-progress.component.html',
  styleUrls: ['./in-progress.component.css']
})
export class InProgressComponent implements OnInit {

  constructor(
    private baskervilleSvc: BaskervilleService,
    ) { }

  ngOnInit(): void {
  }

  isInProgress(): boolean {
    return this.baskervilleSvc.inProgress;
  }

}

