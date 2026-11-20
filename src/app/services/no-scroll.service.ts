import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoScrollService {

  constructor() { }

  private noScroll = new BehaviorSubject<boolean | null>(null);
  noScroll$ = this.noScroll.asObservable();

  noScrollEmit(value: boolean){
    this.noScroll.next(value)
  }
}
