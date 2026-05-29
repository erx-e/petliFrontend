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
  ) {
    // Hidratar user$ desde localStorage al arranque. Sin esto, en cada refresh
    // el BehaviorSubject empieza en null y el nav (y otras pantallas que
    // consumen user$) renderizan el estado "no logueado" hasta que /user/get
    // responde — visible como un flash de "Iniciar sesión" → "Home / Perfil".
    // Solo se hidrata si hay token; si hay cache sin token, es un cache
    // huérfano (sesión cerrada en otro tab, p.ej.) y se descarta.
    const token = this.tokenService.getToken();
    if (token) {
      const cached = this.readCachedUser();
      if (cached) {
        this.user.next(cached);
      }
    } else {
      this.clearCachedUser();
    }
  }

  private user = new BehaviorSubject<UserView | null>(null);

  user$ = this.user.asObservable();

  private apiUrl = `${environment.API_URL}/user`;
  private readonly cachedUserKey = 'pl_cached_user';

  getCurrentUser() {
    const token = this.tokenService.getToken();
    if (token) {
      // Revalidación en segundo plano. Si el token caducó/se revocó, limpiamos
      // todo y emitimos null para que el nav vuelva al estado no logueado.
      this.getProfile().subscribe({
        error: () => {
          this.tokenService.removeToken();
          this.setUser(null);
        },
      });
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
          return throwError('El email o contraseña estan incorrectos');
        }),
        tap((response) => {
          this.setUser(response.user);
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
        tap((user) => this.setUser(user))
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
    this.setUser(null);
  }

  // Sincroniza BehaviorSubject + localStorage en una sola operación. Cualquier
  // cambio de estado de usuario debe pasar por aquí para mantener ambos en
  // línea (si no, el próximo refresh hidrata datos obsoletos).
  private setUser(user: UserView | null) {
    this.user.next(user);
    if (user) {
      try {
        localStorage.setItem(this.cachedUserKey, JSON.stringify(user));
      } catch {
        // localStorage lleno o deshabilitado: no es bloqueante, el flujo
        // normal sigue funcionando (solo perdemos la mejora del flash).
      }
    } else {
      this.clearCachedUser();
    }
  }

  private readCachedUser(): UserView | null {
    try {
      const raw = localStorage.getItem(this.cachedUserKey);
      return raw ? (JSON.parse(raw) as UserView) : null;
    } catch {
      return null;
    }
  }

  private clearCachedUser() {
    localStorage.removeItem(this.cachedUserKey);
  }
}
