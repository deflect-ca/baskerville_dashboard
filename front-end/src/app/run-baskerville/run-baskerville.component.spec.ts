import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RunBaskervilleComponent } from './run-baskerville.component';

describe('RunBaskervilleComponent', () => {
  let component: RunBaskervilleComponent;
  let fixture: ComponentFixture<RunBaskervilleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RunBaskervilleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RunBaskervilleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
