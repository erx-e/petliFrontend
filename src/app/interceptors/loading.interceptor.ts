import { Injectable } from "@angular/core";
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken, HttpContext, HttpResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { LoadingService } from "../services/loading.service";
import { finalize, tap } from "rxjs/operators";
import { CacheService } from "../services/cache.service";
import { TimerCacheService } from "../services/timer-cache.service";

export const CHECK_LOADING = new HttpContextToken<boolean>(() => false);

export function checkLoading() {
  return new HttpContext().set(CHECK_LOADING, true);
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(
    private loadingSerivce: LoadingService,
    private cacheService: CacheService,
    private timerCacheService: TimerCacheService
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    this.timerCacheService.startTimer()
    let remainnigTimeInMiliseconds = this.timerCacheService.getRemainingTime()
    if(remainnigTimeInMiliseconds <= 0){
      this.timerCacheService.resetTimer()
      this.cacheService.invalidateCache()
    }

    if (request.method === "GET") {
      const cachedResponse: HttpResponse<any> | undefined =
        this.cacheService.getResponse(request.urlWithParams);

      if (cachedResponse) {
        this.loadingSerivce.hide()
        return of(cachedResponse);
      }

      if (request.context.get(CHECK_LOADING)) {
        this.loadingSerivce.show();
        return next.handle(request).pipe(
          tap((event) => {
            if (event instanceof HttpResponse) {
              this.cacheService.recordResponse(request.urlWithParams, event);
            }
          }),
          finalize(() => this.loadingSerivce.hide())
        );
      }
      return next.handle(request).pipe(
        tap((event) => {
          if (event instanceof HttpResponse) {
            this.cacheService.recordResponse(request.urlWithParams, event);
          }
        })
      );
    } else {
      if(request.context.get(CHECK_LOADING)){
        this.loadingSerivce.show();
        return next.handle(request).pipe(
          finalize(() => this.loadingSerivce.hide())
        );
      }
      this.cacheService.invalidateCache()
      return next.handle(request);
    }
  }
}
