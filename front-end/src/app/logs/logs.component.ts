import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit {
  name = 'logs';

  constructor() { }

  ngOnInit(): void {
  }

}

