import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentManagementComponent } from './component-management.component';

describe('ComponentManagementComponent', () => {
  let component: ComponentManagementComponent;
  let fixture: ComponentFixture<ComponentManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComponentManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
