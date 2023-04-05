import { cornerTypes } from "./trackPlay.js";
import { getNewID, loadJSONFile, MAX_BRAKING, MAX_SPEED, carTypes, statTypes } from "./utility.js";

const N_OF_PARTS = 5;
export const CarPartTypes = [
    "Suspension",
    "Chassis",
    "FrontWing",
    "RearWing",
    "Underbody"
];

const PartsFactors = Object.freeze({
    Suspension: 0.2,
    Chassis: 0.2,
    FrontWing: 0.15,
    RearWing: 0.1,
    Underbody: 0.35
});

export const CarStats = Object.freeze({
    braking: 0,
    lowSpeed: 1,
    mediumSpeed: 2,
    highSpeed: 3,
});

export default class Team{
    constructor(name, color){
        this.id = getNewID("team");
        this.color = color;
        this.name = name;

        //have 1 car for each driver pls
        this.carBlueprint = new Car({
            Suspension: new CarPart(85, 85, 85, 85, 100, 95),
            Chassis: new CarPart(85, 85, 85, 85, 100, 95),
            FrontWing: new CarPart(85, 85, 85, 85, 100, 95),
            RearWing: new CarPart(85, 85, 85, 85, 100, 95),
            Underbody: new CarPart(85, 85, 85, 85, 100, 95)
        }, new Engine(100, 85, 85, 85), new Gearbox(100, 90, 85), new Brakes(100, 95, 91));
        this.carBlueprint.gearbox.setTopSpeed(this.getTopSpeed());
        this.drivers = [];
        this.carStats = [];

        this.cars = [];
        this.carParts = [];

        this.deg = 98;
        this.points = 0;
    }

    async loadTeam(path){
        let jsondata = await loadJSONFile(path);
        let carParts = {};
        let carPartsTypes = carTypes[jsondata.teamType];
        let savedParts = jsondata.stats;

        for(let i = 0; i < carPartsTypes.length; i++){
            let partStats = [];
            let partType = carPartsTypes[i];

            statTypes.forEach(element => {
                partStats.push(savedParts[partType][element]);
            });

            carParts[partType] = new CarPart(partStats[0], partStats[1], partStats[2], partStats[3], 100, partStats[4]);
        }
        let savedEngine = jsondata.engine;
        let savedBrakes = jsondata.brakes;
        let savedGearbox = jsondata.gearbox;

        let engine = new Engine(100, savedEngine.reliability, savedEngine.performance, savedEngine.efficiency);
        let brakes = new Brakes(100, savedBrakes.reliability, savedBrakes.performance);
        let gearbox = new Gearbox(100, savedGearbox.reliability, savedGearbox.performance);
        this.carBlueprint = new Car(carParts, engine, gearbox, brakes);
        //this.carBlueprint.gearbox.setTopSpeed(this.getTopSpeed());


        this.name = jsondata.teamName;
        this.deg = jsondata.teamDeg;
        this.color = jsondata.teamColor;


    }

    createCar(id){
        //Check that driver is part of this team
        let idIsCorrect = false
        this.drivers.forEach(element => {
            if(element.id == id)
                idIsCorrect = true;
        });
        if(!idIsCorrect){
            console.error("Trying to make car for wrong driver for team" + this.name);
            return null;
        }

        //Check that driver doesn't already have car with id
        this.cars.forEach(element => {
            if(element.id == id)
                return element;
        });

        let newCarParts = {};
        for(let i = 0; i < CarPartTypes.length; i++){
            let part = CarPartTypes[i];
            newCarParts[part] = this.copyCarPart(this.carBlueprint.carParts[part]);
        }


        let engine = this.carBlueprint.engine;
        let gearbox = this.carBlueprint.gearbox;
        let brakes = this.carBlueprint.brakes;

        let newCar = new Car(newCarParts,
            new Engine(engine.condition, engine.reliability, engine.performance, engine.fuel_use),
            new Gearbox(gearbox.condition, gearbox.reliability, gearbox.performance), 
            new Brakes(brakes.condition, brakes.reliability, brakes.performance), id);

        //newCar.gearbox.setTopSpeed(this.getTopSpeed());

        this.cars.push(newCar);

        return newCar;
    }

    copyCarPart(part){
        return new CarPart(part.lowSpeed, part.mediumSpeed, part.highSpeed, part.straight, part.condition, part.reliability);
    }

    getTopSpeed(){
        //Add air density stat or something to track
        return this.carBlueprint.getTopSpeed();
    }

    addDriver(driver){
        if(this.drivers.length == 2){
            console.error("Too many drivers assigned to team" + this.name);
            return;
        }

        this.drivers.push(driver);
    }

    removeDriver(driver){
        if(this.drivers.indexOf(driver) == -1){
            console.error("Trying to remove driver that doesn't exist from team" + this.name);
            return;
        }

        this.drivers.splice(this.drivers.indexOf(driver), 1);
    }

    /*
    getStat(corner){
        //Save stats intermittently
        if(this.carStats[CarStats[corner]] == undefined)
            this.carStats[CarStats[corner]] = this.carBlueprint.getStat(corner);
        
        return this.carStats[CarStats[corner]];
    }

    getBraking(){
        return this.carBlueprint.getBraking();
    }

    getAcc(driverSpeed){
    
        return this.carBlueprint.getAcc(driverSpeed);
    }*/

}

export const CAR_EFFECT = 0.5;

class Car{
    constructor(carParts, engine, gearbox, brakes, driverID = -1) {
        this.carParts = carParts;
        this.engine = engine;
        this.gearbox = gearbox;
        this.brakes = brakes;
        this.driverID = driverID;
        this.carStats = [];
    }

    getStat(corner){
        if(this.carStats[CarStats[corner]] != undefined)
            return this.carStats[CarStats[corner]];


        let stat = 0;

        for(let i = 0; i < CarPartTypes.length; i++){
            let carPart = CarPartTypes[i];
            stat += this.carParts[carPart][corner] * PartsFactors[carPart];
        }

        if(corner == cornerTypes.straight)
            stat *= (this.engine.performance / 100);

        this.carStats[CarStats[corner]] = stat;

        return this.carStats[CarStats[corner]];
    }

    getTopSpeed(){
        return Math.pow((this.getStat(cornerTypes.straight) / 100), 0.5) * MAX_SPEED;
    }

    getBraking(){
        return MAX_BRAKING * (this.brakes.performance / 100);
    }

    getAcc(driverSpeed){
        
        let currGear = this.gearbox.currGear;
        let nextSpeedValue = this.gearbox.accSpeed[currGear];
        let currSpeedValue = this.gearbox.accSpeed[currGear - 1];
        let nextChangeValue = this.gearbox.gearRange[currGear];
        let currChangeValue = this.gearbox.gearRange[currGear - 1];
        nextChangeValue -= currChangeValue;
        driverSpeed -= currChangeValue;

        let speed = ((nextChangeValue - driverSpeed) / nextChangeValue) * currSpeedValue + (driverSpeed / nextChangeValue) * nextSpeedValue;

        return (this.gearbox.performance / 100) * speed;
        //return (this.gearbox.performance / 100) * this.gearbox.accSpeed[this.gearbox.currGear - 1];
    }

}

class Part{
    constructor(condition, reliability) {
        this.condition = condition;
        this.reliability = reliability
    }

    wearPart(){

    }

    upgradePart(){
        //TODO PLS
    }
}

class CarPart extends Part{
    constructor(lowSpeed, mediumSpeed, highSpeed, straight, condition, reliability){
        super(condition, reliability);
        this.lowSpeed = lowSpeed;
        this.mediumSpeed = mediumSpeed;
        this.highSpeed = highSpeed;
        this.straight = straight;
    }
}

class Engine extends Part{
    constructor(condition, reliability, performance, fuel_use) {
        super(condition, reliability);
        this.performance = performance;
        this.fuel_use = fuel_use;
    }
}

const N_OF_GEARS = 8;

class Gearbox extends Part{
    constructor(condition, reliability, performance) {
        super(condition, reliability);
        this.accSpeed = [24.0, 31.0, 40.0, 36.0, 31.0, 29.0, 22.0, 16.0, 0.0];
        this.gearRange = [0.0, 90.0, 130.0, 190.0, 224.0, 258.0, 285.0, 305.0, MAX_SPEED];
        this.currGear = 1;
        this.performance = performance;
    }

    setTopSpeed(topSpeed){
        this.gearRange[this.gearRange.length - 1] = topSpeed;
    }

    changeGear(driverSpeed){
        if(this.currGear == 1){
            if(driverSpeed >= this.gearRange[this.currGear]){
                this.currGear++;
                return true
            }
        }
        else if(this.currGear == N_OF_GEARS){
            if(driverSpeed < this.gearRange[this.currGear - 1]){
                this.currGear--;
                return true
            }
        }
        else{
            if(driverSpeed < this.gearRange[this.currGear - 1]){
                this.currGear--;
                return true
            }
            if(driverSpeed >= this.gearRange[this.currGear]){
                this.currGear++;
                return true
            }
        }
        return false;
    }

}

class Brakes extends Part{
    constructor(condition, reliability, performance) {
        super(condition, reliability);
        this.performance = performance;
    }
}