// Contrato con el backend (.NET 10). El backend serializa con Newtonsoft sin
// camelCase, asi que los nombres de estos miembros SON los nombres del JSON:
// mantenerlos en minuscula tal cual. Los enums viajan por NOMBRE, nunca por
// numero ni por los codigos de una letra que se usaban antes.

/** Estado de la publicacion. Lo fija la creacion y el backend NO permite
 *  cambiarlo en el update (UpdatePostCommand no tiene campo `status`). */
export type PetStatus =
  | "EnAdopcion"
  | "Buscado"
  | "Encontrado"
  | "NecesitadoDeAyuda"
  | "SanoYSalvo";

/** Sexo de la mascota. Ausente en el body de creacion => el backend asume
 *  Unknown; ausente en el update => conserva el valor actual (`c.sex ?? post.Sex`). */
export type PetSex = "Unknown" | "Male" | "Female";

// OJO con lat/lng: el validator del backend exige
// `lat.HasValue == lng.HasValue`, es decir ambos o ninguno. Mandar solo uno
// responde 400. Rangos: lat [-90, 90], lng [-180, 180].

/** Etiqueta en español para mostrar. El backend ya no manda `petState` (el texto
 *  venia de la tabla `pet_state`, que se elimino), asi que la UI la deriva. */
export const PET_STATUS_LABELS: Record<PetStatus, string> = {
  Buscado: "Perdido",
  Encontrado: "Encontrado",
  EnAdopcion: "En adopción",
  NecesitadoDeAyuda: "Necesita ayuda",
  SanoYSalvo: "Sano y salvo",
};

// Nota: la regla "solo Buscado/Encontrado piden lastTimeSeen" (equivalente a
// PetStatus.RequiresLastSeen() del dominio) sigue escrita a mano en las
// plantillas de filter y pet-form. Esta duplicada, pero ahora al menos compara
// contra los nombres del enum; unificarla es una mejora aparte.

/** Imagen en una vista de lectura: el backend solo manda la url (ImageView).
 *  El `idImage` existe unicamente en el prefill de edicion, ver updateImg. */
export interface imgView {
  url: string;
}

/** Vista completa de lectura: GET /postpet/get, /get/{id}, /getByState/{id},
 *  /getByFilter. Equivale a PostPetView del backend. */
export interface postpetView {
  id: string;
  userName: string;
  idUser: number | null;
  petName: string;
  petAge: string;
  petSpecialCondition: string;
  contact: string;
  sex: PetSex;
  status: PetStatus;
  petSpecie: string;
  petBreed: string;
  provinciaName: string;
  cantonName: string;
  sectorName: string | null;
  description: string;
  reward: number | null;
  lastTimeSeen?: string | null;
  lat: number | null;
  lng: number | null;
  urlImgs: imgView[];
}

/** Pin liviano del mapa: GET /postpet/getMapPoints (MapPointView). */
export interface mapPointView {
  id: number;
  petName: string | null;
  status: PetStatus;
  lat: number | null;
  lng: number | null;
  thumbnail: string | null;
}

/** Body de POST /postpet/Create (CreatePostCommand).
 *  No lleva `idUser`: el dueño se toma del JWT (AuthenticatedUserId) y el
 *  backend ignora lo que venga en el body. */
export interface CreatePostpetDTO {
  petName: string;
  petAge: string;
  petSpecialCondition: string;
  contact: string;
  status: PetStatus;
  sex: PetSex;
  idPetSpecie: number;
  idPetBreed: number;
  idProvincia: number;
  idCanton: number;
  idSector: number | null;
  description: string;
  reward: number | null;
  lastTimeSeen?: string | null;
  lat: number | null;
  lng: number | null;
  urlImgs: createImgDTO[];
}

/** Body de PUT /postpet/Update (UpdatePostCommand).
 *  `status` queda fuera a proposito: el backend no lo acepta en el update, el
 *  estado es inmutable tras la creacion. Mandarlo seria un no-op silencioso. */
export interface UpdatePostpetDTO
  extends Omit<Partial<CreatePostpetDTO>, "urlImgs" | "status"> {
  idPostPet: number;
  urlImgs?: updateImg[];
}

/** Respuesta de GET /postpet/getUpdate/{id} (PostPetUpdateView): prefill del
 *  formulario de edicion. Trae `status` para mostrarlo aunque no se pueda
 *  editar, e `idImage` por imagen para saber cuales ya existian. */
export interface UpdatePostpetView {
  idPostPet: number;
  idUser: number;
  petName: string | null;
  petAge: string | null;
  petSpecialCondition: string | null;
  contact: string | null;
  sex: PetSex;
  status: PetStatus;
  idPetSpecie: number | null;
  idPetBreed: number | null;
  idProvincia: number | null;
  idCanton: number | null;
  idSector: number | null;
  description: string | null;
  reward: number | null;
  lastTimeSeen?: string | null;
  lat: number | null;
  lng: number | null;
  urlImgs?: updateImg[];
}

export interface createImgDTO {
  url: string;
}

export interface updateImg {
  url?: string | null;
  idImage?: number;
  file?: File;
}
