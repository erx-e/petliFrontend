// Contrato con el backend (.NET 10), modelo v2 (PL-X8). El backend serializa con
// Newtonsoft sin camelCase, asi que los nombres de estos miembros SON los nombres
// del JSON: mantenerlos en minuscula tal cual. Los enums viajan por NOMBRE.
//
// v2 separa la mascota (el carné, `pet`) del evento (`report`). Un reporte
// `Perdida` apunta a un pet del usuario; `Encontrada`, `Adopcion` y `Ayuda`
// describen al animal con sus propios datos ("inline").

/** Qué clase de publicación es. Inmutable tras la creación. */
export type ReportType =
  | "Perdida"
  | "Encontrada"
  | "Adopcion"
  | "Ayuda";

/** Ciclo de vida. `Resuelto` es definitivo: si la mascota se vuelve a perder,
 *  es un reporte nuevo. */
export type ReportStatus =
  | "Activo"
  | "Resuelto";

/** Sexo de la mascota. Ausente al crear => el backend asume Unknown. */
export type PetSex = "Unknown" | "Male" | "Female";

/** Única fuente de la regla del backend `ReportType.RequiresLastSeen()`: solo
 *  los avistamientos (pérdida y encontrada) piden fecha y hora. Antes esta
 *  regla estaba copiada a mano en seis sitios de las plantillas. */
export function requiresLastSeen(type: ReportType | null | undefined): boolean {
  return type === "Perdida" || type === "Encontrada";
}

/** Etiqueta en español del tipo, para badges y títulos. */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  Perdida: "Perdido",
  Encontrada: "Encontrado",
  Adopcion: "En adopción",
  Ayuda: "Necesita ayuda",
};

/** Etiqueta de un reporte ya resuelto, según su tipo. */
export const RESOLVED_LABELS: Record<ReportType, string> = {
  Perdida: "¡En casa!",
  Encontrada: "Reunido con su familia",
  Adopcion: "Adoptado",
  Ayuda: "Ayudado",
};

/** Área del front que publica y edita cada tipo (rutas /<área>/publicar y
 *  /<área>/editar/:id). */
export const REPORT_TYPE_AREA: Record<ReportType, string> = {
  Perdida: "difunde",
  Encontrada: "encuentra",
  Adopcion: "adopta",
  Ayuda: "ayuda",
};

export const PET_SEX_LABELS: Record<PetSex, string> = {
  Unknown: "Sexo desconocido",
  Male: "Macho",
  Female: "Hembra",
};

// OJO con lat/lng: el backend exige ambos o ninguno (400 si llega uno solo).
// Rangos: lat [-90, 90], lng [-180, 180].

/** Imagen en una vista de lectura: solo la url. */
export interface imgView {
  url: string;
}

/** Imagen editable (prefill de edición): con su id, para quitarla o reemplazarla. */
export interface editableImgView {
  idImage: number;
  url: string;
}

/** Vista completa: GET /report/getByFilter y /report/get/{id} (ReportView).
 *  Los datos del animal ya vienen unificados (del pet en una Perdida, del
 *  propio reporte en el resto). `provinciaName` es derivada del cantón. */
export interface reportView {
  id: number;
  type: ReportType;
  status: ReportStatus;
  idUser: number;
  userName: string;
  idPet: number | null;          // solo Perdida
  petName: string | null;
  sex: PetSex;
  petSpecie: string;
  petBreed: string | null;
  petAge: string | null;         // solo inline (edad estimada)
  birthDate: string | null;      // solo Perdida (fecha aproximada del pet)
  petSpecialCondition: string | null;
  contact: string;
  description: string;
  reward: number | null;
  lastTimeSeen: string | null;
  provinciaName: string;
  cantonName: string;
  sectorName: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  resolvedAt: string | null;
  urlImgs: imgView[];
}

/** Pin del mapa: GET /report/getMapPoints (MapPointView). */
export interface mapPointView {
  id: number;
  type: ReportType;
  petName: string | null;
  lat: number;
  lng: number;
  thumbnail: string | null;
}

/** Prefill del formulario de edición: GET /report/getUpdate/{id}.
 *  `idProvincia` es derivada (del cantón) y de solo lectura: sirve para
 *  precargar la cascada; el update no la acepta. */
export interface reportUpdateView {
  idReport: number;
  type: ReportType;
  status: ReportStatus;
  idPet: number | null;
  petName: string | null;
  idPetSpecie: number;
  idPetBreed: number | null;
  sex: PetSex;
  petAge: string | null;
  birthDate: string | null;
  petSpecialCondition: string | null;
  description: string;
  contact: string;
  reward: number | null;
  lastTimeSeen: string | null;
  idProvincia: number;
  idCanton: number;
  idSector: number | null;
  lat: number | null;
  lng: number | null;
  urlImgs: editableImgView[];
}

/** Respuesta de create / update / resolve (ReportMutationView). */
export interface reportMutationView {
  id: number;
  type: ReportType;
  status: ReportStatus;
  idPet: number | null;
  resolvedAt: string | null;
}

/** Body de POST /report/create. Reglas por tipo (el backend RECHAZA con 400 lo
 *  que no corresponde, en vez de ignorarlo):
 *  - Perdida con pet nuevo: petName + idPetSpecie; la edad va como birthDate.
 *  - Perdida con pet existente (idPet): SIN datos del animal ni urlImgs.
 *  - Encontrada / Adopcion / Ayuda: idPetSpecie; petAge libre; sin birthDate.
 *  - reward solo en Perdida. La provincia NO se envía (se deriva del cantón).
 *  No lleva idUser: el dueño sale del JWT. */
export interface CreateReportDTO {
  type: ReportType;
  idPet?: number | null;
  petName?: string | null;
  idPetSpecie?: number | null;
  idPetBreed?: number | null;
  sex?: PetSex | null;
  petAge?: string | null;
  birthDate?: string | null;
  petSpecialCondition?: string | null;
  description: string;
  contact: string;
  reward?: number | null;
  lastTimeSeen?: string | null;
  idCanton: number;
  idSector?: number | null;
  lat?: number | null;
  lng?: number | null;
  urlImgs: createImgDTO[];
}

/** Body de PUT /report/update. REEMPLAZA los campos editables: un campo ausente
 *  queda vacío en el backend, así que se manda SIEMPRE el formulario completo
 *  (incluidos los campos sin control en la UI, tal como llegaron en el prefill).
 *  `type` no va: es inmutable. Las imágenes sí van por delta (ver updateImg). */
export interface UpdateReportDTO {
  idReport: number;
  petName: string | null;
  idPetSpecie: number;
  idPetBreed: number | null;
  sex: PetSex;
  petAge: string | null;
  birthDate: string | null;
  petSpecialCondition: string | null;
  description: string;
  contact: string;
  reward: number | null;
  lastTimeSeen: string | null;
  idCanton: number;
  idSector: number | null;
  lat: number | null;
  lng: number | null;
  urlImgs: updateImg[];
}

/** Filtros de GET /report/getByFilter. `status` vale Activo si no se envía. */
export interface ReportFilter {
  type?: ReportType | null;
  status?: ReportStatus | null;
  sex?: PetSex | null;
  petSpecieId?: number | null;
  petBreedId?: number | null;
  provinciaId?: number | null;
  cantonId?: number | null;
  sectorId?: number | null;
  userId?: number | null;
  date?: string | null;
  order?: number | null;
}

/** Viewport del mapa: los cuatro bordes o ninguno (si no, 400). */
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface createImgDTO {
  url: string;
}

/** Imagen en el body de update: `{idImage: null, url}` agrega, `{idImage,
 *  url: null}` quita, `{idImage, url}` reemplaza. `file` es solo de la UI. */
export interface updateImg {
  url?: string | null;
  idImage?: number | null;
  file?: File;
}

/** Una mascota del usuario: GET /pet/mine (PetView). `isLost` es derivado: hay
 *  un reporte Perdida activo que la apunta. `urlImgs` trae la principal primero. */
export interface petView {
  id: number;
  petName: string;
  idPetSpecie: number;
  petSpecie: string;
  idPetBreed: number | null;
  petBreed: string | null;
  sex: PetSex;
  birthDate: string | null;
  petSpecialCondition: string | null;
  idCanton: number;
  cantonName: string;
  idSector: number | null;
  sectorName: string | null;
  isLost: boolean;
  urlImgs: imgView[];
}

// --- Edad aproximada <-> fecha de nacimiento (D12) ---
// El carné guarda una fecha de nacimiento aproximada; el formulario pide la
// edad (años + meses) y la convierte aquí.

/** Fecha (yyyy-MM-dd) de hace `years` años y `months` meses. null si no hay edad. */
export function birthDateFromAge(years: number | null, months: number | null): string | null {
  const y = Number(years) || 0;
  const m = Number(months) || 0;
  if (y <= 0 && m <= 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - (y * 12 + m));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Edad (años y meses cumplidos) a partir de una fecha de nacimiento. */
export function ageFromBirthDate(birthDate: string | null): { years: number; months: number } | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (isNaN(born.getTime())) return null;
  const now = new Date();
  let total = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) total--;
  total = Math.max(total, 0);
  return { years: Math.floor(total / 12), months: total % 12 };
}

/** Texto corto de la edad ("2 años", "5 meses"), para chips. */
export function ageLabel(birthDate: string | null): string | null {
  const age = ageFromBirthDate(birthDate);
  if (!age) return null;
  if (age.years > 0) return age.years === 1 ? "1 año" : `${age.years} años`;
  return age.months === 1 ? "1 mes" : `${age.months} meses`;
}
