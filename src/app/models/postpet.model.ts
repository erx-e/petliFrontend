export interface postpetView {
  id: string;
  userName: string;
  idUser: number | null;
  petName: string;
  petAge: string;
  petSpecialCondition: string;
  contact: string;
  petState: string;
  petStateId: string;
  petSpecie: string;
  petBreed: string;
  provinciaName: string;
  cantonName: string;
  sectorName: string | null;
  description: string;
  reward: number | null;
  lastTimeSeen?: string | null;
  linkMapSeen: string | null;
  urlImgs: img[];
}

export interface CreatePostpetDTO {
  idUser: number;
  petName: string;
  petAge: string;
  petSpecialCondition: string;
  contact: string;
  idState: string;
  idPetSpecie: number;
  idPetBreed: number;
  idProvincia: number;
  idCanton: number;
  idSector: number | null;
  description: string;
  reward: number | null;
  lastTimeSeen?: string | null;
  linkMapSeen: string | null;
  urlImgs: createImgDTO[];
}

export interface UpdatePostpetDTO
  extends Omit<Partial<CreatePostpetDTO>, "idUser" | "urlImgs"> {
  idUser: number;
  idPostPet: number;
  urlImgs?: updateImg[];
}

export interface createImgDTO {
  url: string;
}

export interface img {
  url: string;
  idImage: number;
}

export interface updateImg {
  url?: string | null;
  idImage?: number;
  file?: File;
}
