import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class TimerCacheService {
  constructor() {}

  private isTimerStarted = false;
  dDay = new Date();
  timeDifference: number;

  private getTimeDifference() {
    this.timeDifference = this.dDay.getTime() - new Date().getTime();
  }

  startTimer() {
    if (!this.isTimerStarted) {
      this.dDay.setMinutes(this.dDay.getMinutes() + +10);
      this.getTimeDifference();
      this.isTimerStarted = true;
    }
  }

  resetTimer() {
    this.isTimerStarted = false;
    this.getTimeDifference();
  }

  getRemainingTime(): number {
    this.getTimeDifference();
    return this.timeDifference;
  }
}
