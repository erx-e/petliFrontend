import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() { }

  requests: { [key: string]: HttpResponse<any> } = {}


  recordResponse(url: string, request: HttpResponse<any>){
    this.requests[url] = request;
  }

  getResponse(url: string){
    console.log(url)
    return this.requests[url]
  }

  invalidateCache(){
    this.requests = {};
  }
}
