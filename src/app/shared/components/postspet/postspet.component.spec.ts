import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostspetComponent } from './postspet.component';

describe('PostspetComponent', () => {
  let component: PostspetComponent;
  let fixture: ComponentFixture<PostspetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostspetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostspetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
