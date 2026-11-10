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
   * Paso 1: pide al backend una URL firmada para subir. Solo se manda el tipo
   * de imagen: el NOMBRE del archivo lo genera el backend (nunca el cliente) y
   * lo devuelve como `key`, junto con la URL pública. La subida queda pendiente
   * a nombre del usuario 24 h: en ese plazo hay que vincularla en un formulario
   * (por su `key`). Con 30 subidas pendientes, el backend responde 429.
   */
  getPresignedUploadUrl(contentType: string) {
    return this.http.post<PresignedUploadResponse>(
      `${this.apiUrl}/s3/presigned-upload`,
      { contentType },
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
   * Descarta una subida PENDIENTE propia (una foto subida y quitada antes de
   * guardar el formulario). Una foto ya guardada no se borra por aquí: se quita
   * editando su reporte o su mascota (el backend responde 404). Recibe la key.
   */
  deleteImage(key: string) {
    return this.http.delete(
      `${this.apiUrl}/s3/object/${encodeURIComponent(key)}`,
      { context: checkToken() }
    );
  }
}
