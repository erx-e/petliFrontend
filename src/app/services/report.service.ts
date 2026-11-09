import { HttpClient, HttpErrorResponse, HttpParams, HttpStatusCode } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import {
  CreateReportDTO,
  MapBounds,
  mapPointView,
  ReportFilter,
  reportMutationView,
  reportUpdateView,
  reportView,
  UpdateReportDTO,
} from "../models/report.model";
import { checkToken } from "../interceptors/token.interceptor";
import { checkLoading } from "../interceptors/loading.interceptor";
import { catchError } from "rxjs/operators";
import { Observable, throwError } from "rxjs";

/** Reportes (v2): reemplaza a PostpetService. Endpoints bajo /report. */
@Injectable({
  providedIn: "root",
})
export class ReportService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.API_URL}`;

  /** Añade un query param solo si tiene valor. `params.set(k, undefined)` manda
   *  literalmente `k=undefined`, que el backend no puede bindear a `int?` y
   *  responde 400: por eso cada parametro opcional pasa por aqui. */
  private static withParam(
    params: HttpParams,
    key: string,
    value: string | number | null | undefined
  ): HttpParams {
    return value === null || value === undefined || value === ""
      ? params
      : params.set(key, value);
  }

  private static filterParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filter ?? {})) {
      params = ReportService.withParam(params, key, value as string | number | null);
    }
    return params;
  }

  /** Traduce los errores HTTP a un texto para la UI. Los 4xx del backend son
   *  ProblemDetails con el motivo en `title`. */
  private static uiError(fallback: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      switch (error.status) {
        case HttpStatusCode.NotFound:
          return throwError(() => "Publicación no encontrada");
        case HttpStatusCode.Forbidden:
          return throwError(() => "No eres el dueño de esta publicación");
        case HttpStatusCode.Conflict:
          return throwError(() => error.error?.title ?? "La operación ya no es posible");
        case HttpStatusCode.BadRequest:
          return throwError(() => "Revisa los datos del formulario");
        default:
          return throwError(() => fallback);
      }
    };
  }

  /** GET /report/getByFilter: el único listado. `status` vale Activo si no se
   *  envía; la home pide `{ type }` con limit 5. */
  getByFilter(filter: ReportFilter, limit?: number, offset?: number) {
    let params = ReportService.filterParams(filter);
    params = ReportService.withParam(params, "limit", limit);
    params = ReportService.withParam(params, "offset", offset);
    return this.http.get<reportView[]>(`${this.apiUrl}/report/getByFilter`, {
      params,
      context: checkLoading(),
    });
  }

  /** GET /report/getMapPoints: mismos filtros + viewport opcional; tope de 500
   *  pines (los más recientes). Sin consumidor todavía (PL-X4). */
  getMapPoints(filter: ReportFilter, bounds?: MapBounds) {
    let params = ReportService.filterParams({ ...filter, order: null });
    if (bounds) {
      params = params
        .set("minLat", bounds.minLat)
        .set("maxLat", bounds.maxLat)
        .set("minLng", bounds.minLng)
        .set("maxLng", bounds.maxLng);
    }
    return this.http.get<mapPointView[]>(`${this.apiUrl}/report/getMapPoints`, {
      params,
      context: checkLoading(),
    });
  }

  getById(id: number) {
    return this.http
      .get<reportView>(`${this.apiUrl}/report/get/${id}`, {
        context: checkLoading(),
      })
      .pipe(catchError(ReportService.uiError("Error del servidor")));
  }

  getForUpdate(id: number) {
    return this.http
      .get<reportUpdateView>(`${this.apiUrl}/report/getUpdate/${id}`)
      .pipe(catchError(ReportService.uiError("Error del servidor")));
  }

  create(dto: CreateReportDTO) {
    return this.http
      .post<reportMutationView>(`${this.apiUrl}/report/create`, dto, {
        context: checkToken(),
      })
      .pipe(catchError(ReportService.uiError("No pudimos publicar. Inténtalo de nuevo en un momento.")));
  }

  update(dto: UpdateReportDTO) {
    return this.http
      .put<reportMutationView>(`${this.apiUrl}/report/update`, dto, {
        context: checkToken(),
      })
      .pipe(catchError(ReportService.uiError("No pudimos guardar los cambios. Inténtalo de nuevo en un momento.")));
  }

  /** PUT /report/resolve/{id}: "¡Está en casa!" / caso cerrado. Definitivo;
   *  409 si ya estaba resuelto. */
  resolve(id: number) {
    return this.http
      .put<reportMutationView>(`${this.apiUrl}/report/resolve/${id}`, null, {
        context: checkToken(),
      })
      .pipe(catchError(ReportService.uiError("No pudimos marcarla como resuelta. Inténtalo de nuevo.")));
  }

  /** DELETE /report/delete/{id}. Borrar una Perdida no borra el pet. */
  delete(id: number) {
    return this.http
      .delete<number>(`${this.apiUrl}/report/delete/${id}`, {
        context: checkToken(),
      })
      .pipe(catchError(ReportService.uiError("No pudimos eliminar la publicación. Inténtalo de nuevo en un momento.")));
  }
}
