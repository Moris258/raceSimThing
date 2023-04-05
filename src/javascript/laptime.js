import { ConvertLapTime, TIMING_INTERVAL } from "./utility.js";

export default class Laptime{
    constructor(tyre) {
        this.time = 0;
        this.tyreAge = tyre.age;
        this.tyreGrip = tyre.grip;
        this.tyreHeating = tyre.heating;
        this.tyreType = tyre.type;
    }

    update(){
        this.time += TIMING_INTERVAL;
    }

    printLaptime(){
        console.log(ConvertLapTime(this.time / 1000));
    }

    getLaptime(){
        return ConvertLapTime(this.time / 1000);
    }

}