import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackContextComponent } from './feedback-context.component';

describe('FeedbackContextComponent', () => {
  let component: FeedbackContextComponent;
  let fixture: ComponentFixture<FeedbackContextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeedbackContextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
