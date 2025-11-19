import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { authUser, UserView, authUserResponse } from '../models/user.model';
import { TokenService } from './token.service';
import { checkToken } from '../interceptors/token.interceptor';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
    private location: Location
  ) {}

  private user = new BehaviorSubject<UserView | null>(null);

  user$ = this.user.asObservable();

  private apiUrl = `${environment.API_URL}/user`;

  getCurrentUser() {
    const token = this.tokenService.getToken();
    if (token) {
      this.getProfile().subscribe();
      console.log(this.router.url);
      if (this.location.isCurrentPathEqualTo('/')) {
        this.router.navigate(['/home']);
      }
    }
  }

  login(auth: authUser): Observable<authUserResponse> {
    return this.http
      .post<authUserResponse>(`${this.apiUrl}/login`, auth, {
        context: checkToken(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError('El email o contraseña estan incorrectos');
          }
          console.log(error);
          return throwError('El email o contraseña estan incorrectos');
        }),
        tap((response) => {
          this.user.next(response.user);
          this.tokenService.saveToken(response.token);
        })
      );
  }

  getProfile(id?: number) {
    if (id != undefined) {
      return this.http.get<UserView>(`${this.apiUrl}/get/${id}`, {
        context: checkToken(),
      });
    }

    // const headers = new HttpHeaders();
    // headers.set("Authorization", `Bearer ${token}`);

    return this.http
      .get<UserView>(`${this.apiUrl}/get`, { context: checkToken() })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.Unauthorized) {
            return throwError('No estas autorizado');
          }
          return throwError('Bad request');
        }),
        tap((user) => this.user.next(user))
      );
    // .subscribe((profile) => this.user.next(profile));
    //headers : {
    //   Authorization: `Bearer ${token}`,
    // },
  }

  loginAndGetProfile(auth: authUser) {
    this.login(auth).pipe(switchMap(() => this.getProfile()));
  }

  logout() {
    this.tokenService.removeToken();
    this.user.next(null);
  }
}
