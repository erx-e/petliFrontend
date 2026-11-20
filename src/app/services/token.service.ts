import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  saveToken(token: string){
    // document.cookie = `token=${token}`;
    localStorage.setItem('tokenPetL', token)
  }

  getToken(){
    return localStorage.getItem('tokenPetL');
  }

  removeToken() {
    localStorage.removeItem('tokenPetL');
  }
}
