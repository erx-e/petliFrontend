import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import {
  breed,
  canton,
  provincia,
  sector,
  specie,
} from "../models/category.model";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.API_URL}/category`;

  getSpecies() {
    return this.http.get<specie[]>(`${this.apiUrl}/species`);
  }

  getBreeds() {
    return this.http.get<breed[]>(`${this.apiUrl}/breeds`);
  }

  getBreedsBySpecie(id: number) {
    return this.http.get<breed[]>(`${this.apiUrl}/breedsBySpecie/${id}`);
  }

  getProvincias() {
    return this.http.get<provincia[]>(`${this.apiUrl}/provincias`);
  }

  getCantones() {
    return this.http.get<canton[]>(`${this.apiUrl}/cantones`);
  }

  getCantonesByProv(id: number) {
    return this.http.get<canton[]>(`${this.apiUrl}/cantonesByProv/${id}`);
  }

  getSectores() {
    return this.http.get<sector[]>(`${this.apiUrl}/sectores`);
  }

  getSectoresByCanton(id: number) {
    return this.http.get<sector[]>(`${this.apiUrl}/sectoresByCanton/${id}`);
  }
}
