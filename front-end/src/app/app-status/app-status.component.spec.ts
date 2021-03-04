import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppStatusComponent } from './app-status.component';

describe('AppStatusComponent', () => {
  let component: AppStatusComponent;
  let fixture: ComponentFixture<AppStatusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

