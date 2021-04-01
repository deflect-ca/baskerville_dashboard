import {AfterViewInit, Component, OnInit} from '@angular/core';
import {BaskervilleService} from '../_services/baskerville.service';
import {NotificationService} from '../_services/notification.service';

@Component({
  selector: 'app-retrain',
  templateUrl: './retrain.component.html',
  styleUrls: ['./retrain.component.css']
})
export class RetrainComponent implements OnInit, AfterViewInit {
  codeModel = {
    language: 'yaml',
    uri: 'main.yaml',
    value: 'loading...',
  };

  constructor(
    private baskervilleSvc: BaskervilleService,
    private notificationSvc: NotificationService,
  ) { }

  ngOnInit(): void {
    this.baskervilleSvc.loadConfig('retrain').subscribe(
      d => {
        console.log(d);
        // this.data = d as Envelop;
        this.codeModel = {
          language: 'yaml',
          uri: 'main.yaml',
          value: d.data,
        };
        console.log(d, this.codeModel);
      },
      e => {
        console.error(e);
      },
    );
  }
  ngAfterViewInit(): void {
  }

  onCodeChanged(e): void {
    console.log(e);
    this.codeModel = {
      language: 'yaml',
      uri: 'main.yaml',
      value: e,
    };
  }
  onSubmit(): void {
    this.baskervilleSvc.setInProgress(true);
    this.baskervilleSvc.retrain(this.codeModel.value).subscribe(
      d => {
        console.log(d);
        this.notificationSvc.showSnackBar(d.message);
        this.baskervilleSvc.setInProgress(false);
      },
      e => {
        console.error(e);
        this.baskervilleSvc.setInProgress(false);
      }
    );
  }
}
