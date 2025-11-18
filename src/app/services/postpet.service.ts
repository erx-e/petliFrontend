import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
  HttpStatusCode,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Response } from "../models/response.model";
import {
  CreatePostpetDTO,
  postpetView,
  UpdatePostpetDTO,
} from "../models/postpet.model";
import { checkToken } from "../interceptors/token.interceptor";
import { checkLoading } from "../interceptors/loading.interceptor";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs/internal/observable/throwError";

@Injectable({
  providedIn: "root",
})
export class PostpetService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.API_URL}`;
  private key_id = environment.AWS_KEY_ID;
  private key_secret = environment.AWS_KEY_SECRET;
  private region = environment.AWS_REGION;

  getAll(limit?: number, offset?: number) {
    let params = new HttpParams();
    params = params.set("limit", limit);
    params = params.set("offset", offset);
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
            return throwError("Post no encontrado");
          } else {
            return throwError("Error del servidor");
          }
        })
      );
  }

  getByIdUpdate(id: number) {
    return this.http
      .get<UpdatePostpetDTO>(`${this.apiUrl}/postpet/getUpdate/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError("Post no encontrado");
          } else {
            return throwError("Error del servidor");
          }
        })
      );
  }

  getByState(id: string, limit?: number, offset?: number) {
    let params = new HttpParams();
    params = params.set("limit", limit);
    params = params.set("offset", offset);
    return this.http
      .get<postpetView[]>(`${this.apiUrl}/postpet/getByState/${id}`, {
        params,
        context: checkLoading(),
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.BadRequest) {
            return throwError("Id state must be sent");
          } else {
            return throwError("Error del servidor");
          }
        })
      );
  }

   GetByFilter(
    stateId?: string,
    petSpecieId?: number | null,
    petBreedId?: number | null,
    provinciaId?: number | null,
    cantonId?: number | null,
    sectorId?: number | null,
    userId?: number | null,
    date?: string | null,
    order?: number | null,
    limit?: number,
    offset?: number
  ) {
    let params = new HttpParams();
    if (limit != undefined || offset != undefined) {
      params = params.set("limit", limit);
      params = params.set("offset", offset);
    }

    params =
      stateId != null || stateId != undefined
        ? params.set("stateId", stateId)
        : params;
    params =
      petSpecieId != null || petSpecieId != undefined
        ? params.set("petSpecieId", petSpecieId)
        : params;
    params =
      petBreedId != null || petBreedId != undefined
        ? params.set("petBreedId", petBreedId)
        : params;
    params =
      provinciaId != null || provinciaId != undefined
        ? params.set("provinciaId", provinciaId)
        : params;
    params =
      cantonId != null || cantonId != undefined
        ? params.set("cantonId", cantonId)
        : params;
    params =
      sectorId != null || sectorId != undefined
        ? params.set("sectorId", sectorId)
        : params;
    params =
      userId != null || userId != undefined
        ? params.set("userId", userId)
        : params;
    params =
      date != null || date != undefined ? params.set("date", date) : params;
    params =
      order != null || order != undefined ? params.set("order", order) : params;

    return this.http.get<postpetView[] | null>(
      `${this.apiUrl}/postpet/getByFilter`,
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
            return throwError("Post Id incorrecto");
          } else {
            return throwError("Error del servidor");
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
            return throwError("Post Id incorrecto");
          } else {
            return throwError("Error del servidor");
          }
        })
      );
  }
}
