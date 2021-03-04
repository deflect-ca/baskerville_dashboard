import { Component, OnInit } from '@angular/core';
import {DockerComponent} from '../_models/models';
import {BaskervilleService} from '../_services/baskerville.service';

@Component({
  selector: 'app-component-management',
  templateUrl: './component-management.component.html',
  styleUrls: ['./component-management.component.css']
})
export class ComponentManagementComponent implements OnInit {
  public availableComponents: DockerComponent[];

  constructor(private baskervilleSvc: BaskervilleService) {
    this.availableComponents = [];
  }

  ngOnInit(): void {
    this.baskervilleSvc.getDockerComponents().subscribe(
      d => {
        this.setUpDockerComponents(d.data);
        },
      e => {console.error(e); }
    );
  }
  setUpDockerComponents(data): void {
    for(let i = 0; i < data.length; i++){
      this.availableComponents.push(new DockerComponent(data[i]));
    }
  }
  componentStart(componentName): void {
    this.baskervilleSvc.dockerComponentStart(componentName).subscribe(
      d => {console.log(d); },
      e => {console.error(e); }
    );
  }
  componentStop(componentName): void {
    this.baskervilleSvc.dockerComponentStop(componentName).subscribe(
      d => {console.log(d); },
      e => {console.error(e); }
    );
  }
  componentRestart(componentName): void {
    this.baskervilleSvc.dockerComponentRestart(componentName).subscribe(
      d => {console.log(d); },
      e => {console.error(e); }
    );
  }
}
