import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { EditarComponent } from './editar.component';

describe('EditarComponent', () => {
  let component: EditarComponent;
  let fixture: ComponentFixture<EditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditarComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarComponent);
    component = fixture.componentInstance;
  });

  it('editar rejects a description longer than 1000 characters', () => {
    component.descriptionField.setValue('d'.repeat(1000));
    expect(component.descriptionField.hasError('maxlength')).toBeFalse();
    component.descriptionField.setValue('d'.repeat(1001));
    expect(component.descriptionField.hasError('maxlength')).toBeTrue();
  });
});
