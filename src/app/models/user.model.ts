export interface UserView {
  idUser: number;
  name: string;
  email: string;
  cellNumber: string;
  facebookProfile: string;
}

export interface CreateUserDTO extends UserView {
  password: string;
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {
  idUser: number;
  oldPassword?: string;
}

export interface authUser{
  email: string;
  password: string;
}

export interface authUserResponse{
  user: UserView;
  token: string;
}
