
export interface specie {
  id: number;
  name: string;
}

export interface breed
{
  id: number;
  name: string;
  petSpecieId: number;
}

export interface provincia{
  id: number;
  name: string;
}

export interface canton{
  id: number;
  name: string;
  provinciaId: number;
}

export interface sector{
  id: number;
  name: string;
  cantonId: number;
}
