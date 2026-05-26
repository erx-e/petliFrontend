import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CreateUserDTO, UpdateUserDTO, UserView } from '../models/user.model';
import { Response } from '../models/response.model';
import { catchError, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { throwError } from 'rxjs';
import { checkToken } from '../interceptors/token.interceptor';
import { userErrors } from '../models/errorsModelBinding';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authService: AuthService
  ) {}

  private apiUrl = `${environment.API_URL}/user`;

  update(dto: UpdateUserDTO) {
    return this.http
      .put<UserView>(`${this.apiUrl}/update`, dto, {
        context: checkToken(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError(error.error);
          }
          return throwError('User could not be updated - Bad Request');
        })
      );
  }

  create(dto: CreateUserDTO) {
    return this.http.post<Response>(`${this.apiUrl}/create`, dto).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === HttpStatusCode.BadRequest) {
          if (error.error == 'Email already registered') {
            return throwError({
              email: ['Email already registered'],
            } as userErrors);
          }
        }
        return throwError('User could not be cretated - Bad Request');
      }),
      tap((response: Response) => {
        if (response.token) {
          this.tokenService.saveToken(response.token);
          this.authService.getCurrentUser();
        }
      })
    );
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, {
      context: checkToken(),
    });
  }
}
