import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetrainComponent } from './retrain.component';

describe('RetrainComponent', () => {
  let component: RetrainComponent;
  let fixture: ComponentFixture<RetrainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetrainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
