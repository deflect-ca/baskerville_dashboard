import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TryMenuComponent } from './try-menu.component';

describe('TryMenuComponent', () => {
  let component: TryMenuComponent;
  let fixture: ComponentFixture<TryMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TryMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TryMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

