import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { petView } from "../models/report.model";
import { checkToken } from "../interceptors/token.interceptor";

/** Mascotas (carnés) del usuario. En la rebanada 1 solo se leen: se crean desde
 *  el formulario de pérdida (POST /report/create). */
@Injectable({
  providedIn: "root",
})
export class PetService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.API_URL}`;

  /** GET /pet/mine: pets activos del usuario, con `isLost` derivado. */
  getMine() {
    return this.http.get<petView[]>(`${this.apiUrl}/pet/mine`, {
      context: checkToken(),
    });
  }
}
