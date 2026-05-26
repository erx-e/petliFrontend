import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  isLoading$ = new Subject<boolean>()
  requests: { [key: string]: HttpRequest<any> } = {}
  constructor() { }

  show(){
    this.isLoading$.next(true)
  }

  hide(){
    this.isLoading$.next(false)
  }


}
