import { HttpClient, HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { PetCardDTO, petView } from "../models/report.model";
import { checkToken } from "../interceptors/token.interceptor";

/** "Mis mascotas": todo con sesión y privado (ADR-16). Una mascota se registra
 *  aquí o desde el formulario de pérdida, y solo aparece en público a través de
 *  su reporte. Crear o editar invalida la caché de `pet` (el interceptor). */
@Injectable({
  providedIn: "root",
})
export class PetService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.API_URL}`;

  private static uiError(fallback: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      switch (error.status) {
        case HttpStatusCode.NotFound:
          return throwError(() => "Mascota no encontrada");
        case HttpStatusCode.Forbidden:
          return throwError(() => "Esta mascota no es tuya");
        case HttpStatusCode.BadRequest:
          return throwError(() => "Revisa los datos del formulario. Si una foto falló, súbela de nuevo.");
        default:
          return throwError(() => fallback);
      }
    };
  }

  /** GET /pet/mine: pets activos del usuario, con `isLost` / `lostReportId`. */
  getMine() {
    return this.http.get<petView[]>(`${this.apiUrl}/pet/mine`, {
      context: checkToken(),
    });
  }

  /** POST /pet/create: registrar una mascota sin reportarla. */
  create(dto: PetCardDTO) {
    return this.http
      .post<petView>(`${this.apiUrl}/pet/create`, dto, { context: checkToken() })
      .pipe(catchError(PetService.uiError("No pudimos registrar la mascota. Inténtalo de nuevo en un momento.")));
  }

  /** PUT /pet/update: editar la ficha (solo el dueño). Reemplaza la ficha y su
   *  zona; `imageKeys` es la lista completa de fotos. */
  update(dto: PetCardDTO) {
    return this.http
      .put<petView>(`${this.apiUrl}/pet/update`, dto, { context: checkToken() })
      .pipe(catchError(PetService.uiError("No pudimos guardar los cambios. Inténtalo de nuevo en un momento.")));
  }
}
