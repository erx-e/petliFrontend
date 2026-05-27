import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken,
  HttpContext,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { LoadingService } from "../services/loading.service";

export const CHECK_LOADING = new HttpContextToken<boolean>(() => false);

export function checkLoading() {
  return new HttpContext().set(CHECK_LOADING, true);
}

/**
 * Solo se encarga del spinner global. La caché vive en CacheInterceptor.
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingSerivce: LoadingService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (request.context.get(CHECK_LOADING)) {
      this.loadingSerivce.show();
      return next
        .handle(request)
        .pipe(finalize(() => this.loadingSerivce.hide()));
    }
    return next.handle(request);
  }
}
