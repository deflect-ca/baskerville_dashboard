import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Envelop} from '../_models/models';
import {CodeModel} from '@ngstack/code-editor';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  theme = 'vs-dark';
  @Output() emitter = new EventEmitter();
  @Input() codeModel: CodeModel = {
    language: 'yaml',
    uri: 'main.yaml',
    value: '',
  };
  options = {
    contextmenu: true,
    minimap: {
      enabled: true,
    },
  };

  constructor() {
  }

  ngOnInit(): void {
  }
  onCodeChanged(value): void {
    this.codeModel.value = value;
    this.emitter.emit(value);
  }
}
