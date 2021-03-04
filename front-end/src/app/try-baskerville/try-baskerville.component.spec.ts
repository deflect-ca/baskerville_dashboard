import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TryBaskervilleComponent } from './try-baskerville.component';

describe('TryBaskervilleComponent', () => {
  let component: TryBaskervilleComponent;
  let fixture: ComponentFixture<TryBaskervilleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TryBaskervilleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TryBaskervilleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

