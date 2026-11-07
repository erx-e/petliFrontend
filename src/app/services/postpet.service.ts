import { HttpClient, HttpErrorResponse, HttpParams, HttpStatusCode } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Response } from "../models/response.model";
import {
  CreatePostpetDTO,
  mapPointView,
  PetSex,
  PetStatus,
  postpetView,
  UpdatePostpetDTO,
  UpdatePostpetView,
} from "../models/postpet.model";
import { checkToken } from "../interceptors/token.interceptor";
import { checkLoading } from "../interceptors/loading.interceptor";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class PostpetService {
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

  getAll(limit?: number, offset?: number) {
    let params = new HttpParams();
    params = PostpetService.withParam(params, "limit", limit);
    params = PostpetService.withParam(params, "offset", offset);
    return this.http.get<postpetView[]>(`${this.apiUrl}/postpet/get`, {
      params,
      context: checkLoading(),
    });
  }

  getById(id: number) {
    return this.http
      .get<postpetView>(`${this.apiUrl}/postpet/get/${id}`, {
        context: checkLoading(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError(() => "Post no encontrado");
          } else {
            return throwError(() => "Error del servidor");
          }
        })
      );
  }

  getByIdUpdate(id: number) {
    return this.http
      .get<UpdatePostpetView>(`${this.apiUrl}/postpet/getUpdate/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError(() => "Post no encontrado");
          } else {
            return throwError(() => "Error del servidor");
          }
        })
      );
  }

  /** GET /postpet/getByState/{status}. El segmento de ruta es el NOMBRE del enum
   *  (`Buscado`, `Encontrado`, ...): el binding de ASP.NET acepta el nombre o el
   *  valor numerico, nunca los codigos de una letra que se usaban antes. */
  getByState(status: PetStatus, limit?: number, offset?: number) {
    let params = new HttpParams();
    params = PostpetService.withParam(params, "limit", limit);
    params = PostpetService.withParam(params, "offset", offset);
    return this.http
      .get<postpetView[]>(`${this.apiUrl}/postpet/getByState/${status}`, {
        params,
        context: checkLoading(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError(() => "Estado de mascota invalido");
          } else {
            return throwError(() => "Error del servidor");
          }
        })
      );
  }

  /** GET /postpet/getByFilter.
   *
   *  El primer parametro se llamaba `stateId` y se enviaba con ese nombre, pero
   *  el backend bindea `[FromQuery] PetStatus? status`. Un query param que no
   *  coincide se descarta en silencio, asi que filtrar por estado devolvia
   *  resultados SIN filtrar en vez de fallar. Ahora se manda como `status` y con
   *  el nombre del enum. `sex` tambien existia en el backend y no se enviaba. */
  GetByFilter(
    status?: PetStatus | null,
    petSpecieId?: number | null,
    petBreedId?: number | null,
    provinciaId?: number | null,
    cantonId?: number | null,
    sectorId?: number | null,
    userId?: number | null,
    date?: string | null,
    order?: number | null,
    limit?: number,
    offset?: number,
    sex?: PetSex | null
  ) {
    let params = new HttpParams();
    const add = (k: string, v: string | number | null | undefined) =>
      (params = PostpetService.withParam(params, k, v));

    add("limit", limit);
    add("offset", offset);
    add("status", status);
    add("sex", sex);
    add("petSpecieId", petSpecieId);
    add("petBreedId", petBreedId);
    add("provinciaId", provinciaId);
    add("cantonId", cantonId);
    add("sectorId", sectorId);
    add("userId", userId);
    add("date", date);
    add("order", order);

    return this.http.get<postpetView[] | null>(
      `${this.apiUrl}/postpet/getByFilter`,
      { params, context: checkLoading() }
    );
  }

  /** GET /postpet/getMapPoints. Existia en el backend sin ningun consumidor en
   *  el front (PL-X4); se expone aqui para que el mapa pueda construirse sin
   *  volver a inventar el contrato. Misma forma de filtros que getByFilter,
   *  sin paginacion. */
  getMapPoints(
    status?: PetStatus | null,
    petSpecieId?: number | null,
    petBreedId?: number | null,
    provinciaId?: number | null,
    cantonId?: number | null,
    sectorId?: number | null,
    userId?: number | null,
    date?: string | null,
    order?: number | null,
    sex?: PetSex | null
  ) {
    let params = new HttpParams();
    const add = (k: string, v: string | number | null | undefined) =>
      (params = PostpetService.withParam(params, k, v));

    add("status", status);
    add("sex", sex);
    add("petSpecieId", petSpecieId);
    add("petBreedId", petBreedId);
    add("provinciaId", provinciaId);
    add("cantonId", cantonId);
    add("sectorId", sectorId);
    add("userId", userId);
    add("date", date);
    add("order", order);

    return this.http.get<mapPointView[]>(
      `${this.apiUrl}/postpet/getMapPoints`,
      { params, context: checkLoading() }
    );
  }

  update(dto: UpdatePostpetDTO) {
    return this.http
      .put<Response>(`${this.apiUrl}/postpet/update`, dto, {
        context: checkToken(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError(() => "Post Id incorrecto");
          } else {
            return throwError(() => "Error del servidor");
          }
        })
      );
  }

  create(dto: CreatePostpetDTO) {
    return this.http.post<Response>(`${this.apiUrl}/postpet/create`, dto, {
      context: checkToken(),
    });
  }

  delete(id: number) {
    return this.http
      .delete<Response>(`${this.apiUrl}/postpet/delete/${id}`, {
        context: checkToken(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError(() => "Post Id incorrecto");
          } else {
            return throwError(() => "Error del servidor");
          }
        })
      );
  }
}
