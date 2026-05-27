import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { CacheService } from "../services/cache.service";
import { LoadingService } from "../services/loading.service";
import { CHECK_LOADING } from "./loading.interceptor";

/**
 * Caché de GET con:
 * - TTL por grupo (listados de posts: corto; resto: más largo).
 * - Stale-while-revalidate: si está vencida, devuelve lo cacheado al instante
 *   y refresca en segundo plano (sin spinner) para la próxima vez.
 * - Invalidación granular: una mutación (POST/PUT/DELETE) solo invalida el
 *   recurso afectado (ej. publicar borra la caché de "postpet", no la de
 *   categorías/geografía).
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(
    private cache: CacheService,
    private loading: LoadingService
  ) {}

  // Ventana de frescura por grupo (ms). Pasada esta ventana: stale-while-revalidate.
  private ttlFor(url: string): number {
    if (url.includes("/postpet")) return 20_000; // listados de posts: 20 s
    return 5 * 60_000; // categorías, geografía, perfiles, etc.: 5 min
  }

  // Recurso para invalidación granular: primer segmento tras el API_URL.
  private resourceOf(url: string): string | null {
    const base = environment.API_URL.replace(/\/$/, "");
    const path = url.startsWith(base) ? url.slice(base.length) : url;
    const match = path.match(/\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // Clona el request marcando que NO muestre loading (revalidación en 2º plano).
  private withoutLoading(request: HttpRequest<unknown>): HttpRequest<unknown> {
    return request.clone({ context: request.context.set(CHECK_LOADING, false) });
  }

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (request.method !== "GET") {
      // Mutación: invalida solo el recurso afectado, no toda la caché.
      const resource = this.resourceOf(request.urlWithParams);
      if (resource) this.cache.invalidateResource(resource);
      return next.handle(request);
    }

    const key = request.urlWithParams;
    const entry = this.cache.get(key);
    const record = tap<HttpEvent<unknown>>((event) => {
      if (event instanceof HttpResponse) {
        this.cache.set(key, event, this.ttlFor(key));
      }
    });

    if (entry) {
      // Al servir desde caché no pasamos por el LoadingInterceptor, así que
      // apagamos el spinner explícitamente (componentes que dependen de
      // isLoading$ para mostrar su contenido, p. ej. el detalle).
      this.loading.hide();
      if (Date.now() < entry.expiresAt) {
        // Fresca: respuesta instantánea, sin red ni spinner.
        return of(entry.response.clone());
      }
      // Vencida: sirve lo cacheado YA y revalida en segundo plano (sin spinner).
      next
        .handle(this.withoutLoading(request))
        .pipe(record)
        .subscribe({ error: () => {} });
      return of(entry.response.clone());
    }

    // Sin caché: a la red (con spinner si corresponde) y guarda la respuesta.
    return next.handle(request).pipe(record);
  }
}
