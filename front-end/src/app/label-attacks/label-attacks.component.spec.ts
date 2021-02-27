import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LabelAttacksComponent } from './label-attacks.component';

describe('LabelAttacksComponent', () => {
  let component: LabelAttacksComponent;
  let fixture: ComponentFixture<LabelAttacksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LabelAttacksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelAttacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
