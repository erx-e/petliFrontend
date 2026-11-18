import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisterComponent ],
      imports: [ ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('register validates the name with USER_NAME_PATTERN', () => {
    ['Ana', 'Juan P'].forEach((name) => {
      component.nameField.setValue(name);
      expect(component.nameField.valid).withContext(name).toBeTrue();
    });
    ['A', 'Juan  Pérez'].forEach((name) => {
      component.nameField.setValue(name);
      expect(component.nameField.hasError('pattern')).withContext(name).toBeTrue();
    });
  });

  it('register rejects a name longer than 60 characters', () => {
    component.nameField.setValue('a'.repeat(29) + ' ' + 'b'.repeat(30));
    expect(component.nameField.hasError('maxlength')).toBeFalse();
    component.nameField.setValue('a'.repeat(30) + ' ' + 'b'.repeat(30));
    expect(component.nameField.hasError('maxlength')).toBeTrue();
  });
});
