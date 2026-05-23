import {
  HttpClient,
  HttpEvent,
  HttpHeaders,
  HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { checkToken } from "../interceptors/token.interceptor";
import { PresignedUploadResponse } from "../models/s3.model";

/**
 * Maneja la subida/borrado de imágenes en S3 SIN credenciales de AWS en el
 * frontend. El backend (que sí guarda las credenciales) firma las operaciones:
 * aquí solo se le pide una URL temporal y se sube el archivo directo a S3.
 */
@Injectable({
  providedIn: "root",
})
export class S3StorageService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.API_URL}`;

  /**
   * Paso 1: pide al backend una URL firmada para subir.
   * El backend la genera con sus credenciales y responde, además, con la key
   * y la URL pública final. Lleva el token de la app (checkToken).
   */
  getPresignedUploadUrl(fileName: string, contentType: string) {
    return this.http.post<PresignedUploadResponse>(
      `${this.apiUrl}/s3/presigned-upload`,
      { fileName, contentType },
      { context: checkToken() }
    );
  }

  /**
   * Paso 2: sube el archivo DIRECTO a S3 con la URL firmada.
   * No lleva el token de la app: S3 valida la firma incluida en la URL, por eso
   * este request NO usa checkToken(). `reportProgress` permite mostrar el avance.
   * El Content-Type debe coincidir con el que se firmó en el paso 1.
   */
  uploadToPresignedUrl(
    uploadUrl: string,
    file: File
  ): Observable<HttpEvent<unknown>> {
    const request = new HttpRequest("PUT", uploadUrl, file, {
      headers: new HttpHeaders({ "Content-Type": file.type }),
      reportProgress: true,
    });
    return this.http.request(request);
  }

  /**
   * Borra un objeto del bucket a través del backend (que tiene las credenciales).
   * Recibe la key del objeto (no la URL completa). Lleva el token de la app.
   */
  deleteImage(key: string) {
    return this.http.delete(
      `${this.apiUrl}/s3/object/${encodeURIComponent(key)}`,
      { context: checkToken() }
    );
  }
}
