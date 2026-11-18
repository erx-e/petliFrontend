import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { PublishComponent } from './publish.component';

describe('PublishComponent', () => {
  let component: PublishComponent;
  let fixture: ComponentFixture<PublishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PublishComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PublishComponent);
    component = fixture.componentInstance;
  });

  it('publish rejects a description longer than 1000 characters', () => {
    component.descriptionField.setValue('d'.repeat(1000));
    expect(component.descriptionField.hasError('maxlength')).toBeFalse();
    component.descriptionField.setValue('d'.repeat(1001));
    expect(component.descriptionField.hasError('maxlength')).toBeTrue();
  });
});
