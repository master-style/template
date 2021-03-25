import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CoreService {

    constructor() { }

    timeStart;
    times = 0;
    firstPerformanceTime;
    performanceTime

    performStart() {
        this.timeStart = performance.now();
    }

    performEnd() {
        this.performanceTime = performance.now() - this.timeStart;
        if (this.times === 0) {
            this.firstPerformanceTime = this.performanceTime;
        }
        this.times++;
    }
}
