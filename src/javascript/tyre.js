import { cornerTypes } from "./trackPlay.js";


export const TyreCompounds = Object.freeze({
    hard: 0,
    medium: 1,
    soft: 2,
    intermediate: 3,
    wet: 4,
});

export default class Tyre{
    constructor(type, name, grip, heating, wearRate, wetWeatherPerformance) {
        this.age = 0;
        this.tyreHeating = 20;
        this.type = type;
        this.name = name;
        this.grip = grip;
        this.heating = heating;
        this.wearRate = wearRate;
        this.wetWeatherPerformance = wetWeatherPerformance;
    }

    degradeTyre(trackDeg, raceLength, carDeg, cornerType, driverSmoothness, driverPushMode){
        if(this.grip <= 5){
            this.grip = 5;
            return;
        }

        let cornerTypeNumber = 0;

        switch(cornerType){
            case cornerTypes.straight:
                cornerTypeNumber = 0;
                break;
            case cornerTypes.lowSpeed:
                cornerTypeNumber = 1;
                break;
            case cornerTypes.mediumSpeed:
                cornerTypeNumber = 2;
                break;
            case cornerTypes.highSpeed:
                cornerTypeNumber = 3;
                break;        
        }


        /*let wear = Math.cbrt(trackDeg) * Math.cbrt(4 - cornerTypeNumber) / (((carDeg / 100) * (driverSmoothness / 100))
        * (3.3 - driverPushMode / 10)) * (this.wearRate / 3) * (raceLength / 2);*/
        //Base deg + corner type effect
        let wear = Math.cbrt(trackDeg) * Math.cbrt(4 - cornerTypeNumber);
        //Apply car and driver smoothness stats
        wear /= ((carDeg / 10) * (driverSmoothness / 100)) * (3.3 - driverPushMode/10);
        //Apply wear rate
        wear *= this.wearRate/3;
        //Scale with race length
        wear *= raceLength / 2;


        this.grip -= wear;

        //TODO add heating related stuff
    }

    getTyreFactor(){
        if(this.type > 2){
            //WET TYRES
            if(this.grip > 30)
                return Math.pow(this.grip / 100, 0.04);
            else
                return Math.pow((this.grip / 100) + 0.7, 2) / 2 + 0.45298233455;
        }

        switch(this.type){
            case TyreCompounds.soft:
                return 1 - Math.pow((100 - this.grip) / 100, 2) / 4;
            case TyreCompounds.medium:
                return 0.98 - Math.pow((100 - this.grip) / 100, 2) / 4;
            case TyreCompounds.hard:
                return 0.962 - Math.pow((100 - this.grip) / 100, 2) / 3;
            default:
                return 0.7;
        }
    }

    ageTyres(){
        /*
        switch(type){
            case EventTypes.lapEnd:
                this.age++;
                break;
        }*/
        this.age++;
    }

}

