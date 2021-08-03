import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CodeModel} from '@ngstack/code-editor';
import {BaskervilleService} from '../_services/baskerville.service';
import {Envelop} from '../_models/models';

@Component({
  selector: 'app-pipeline-management',
  templateUrl: './pipeline-management.component.html',
  styleUrls: ['./pipeline-management.component.css']
})
export class PipelineManagementComponent implements OnInit, AfterViewInit {

  theme = 'vs-dark';
  sparkSubmitCmd = '';
  data: Envelop;
  codeModel: CodeModel = {
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

  constructor(private baskervilleSvc: BaskervilleService) {
    this.sparkSubmitCmd = 'spark-submit --master spark://$SPARK_MASTER_HOST:7077 --jars ${BASKERVILLE_ROOT}/data/jars/spark-iforest-2.4.0.99.jar,${BASKERVILLE_ROOT}/data/jars/spark-streaming-kafka-0-8-assembly_2.11-2.4.0.jar,${BASKERVILLE_ROOT}/data/jars/postgresql-42.2.4.jar,${BASKERVILLE_ROOT}/data/jars/spark-redis_2.11-2.5.0-SNAPSHOT-jar-with-dependencies.jar --total-executor-cores=6 --conf spark.memory.offHeap.enabled=true --conf spark.memory.offHeap.size=2g $BASKERVILLE_ROOT/src/baskerville/main.py postprocessing -c $BASKERVILLE_ROOT/conf/postprocessing.yaml'
  }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.baskervilleSvc.loadConfig('preprocessing').subscribe(
      d => {
        this.data = d as Envelop;
        this.codeModel = {
          language: 'yaml',
          uri: 'main.yaml',
          value: this.data.data,
        };
        console.log(d, this.codeModel);
      },
      e => {
        console.error(e);
      },
    );
  }
  onCodeChanged(value): any {
    this.codeModel.value = this.data.message;
  }
}

