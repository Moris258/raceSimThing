import Laptime from "./laptime.js";
import Statistic, { Telemetry } from "./stat.js";
import { CAR_EFFECT } from "./team.js";
import { cornerTypes, SessionNames } from "./trackPlay.js";
import Tyre, { TyreCompounds } from "./tyre.js";
import { DRAG_EFFECT, DrawCircle, DrawText, getNewID, LOCKUP_SPEED, MAX_BRAKING, MAX_DRAG, MAX_SPEED, TIMING_INTERVAL, WHEEL_SPIN_SPEED } from "./utility.js";

export const STAT_EFFECT = 0.6;
export const BRAKING_STAT_EFFECT = STAT_EFFECT * 3;
export const ACC_STAT_EFFECT = STAT_EFFECT * 3;
export const CORNERING_STAT_EFFECT = STAT_EFFECT * 2 * 0.04;

export const StatNames = Object.freeze({
    cornering: 0,
    braking: 1,
    traction: 2,
    consistency: 3,
    focus: 4,
    experience: 5,
    smoothness: 6,
    form: 7,
    overtake: 8,
    defense: 9,
    adaptability: 10,
    age: 11,
    potential: 12,
});

const OvertakeStatus = Object.freeze({
    cantOvertake: Symbol("CantOvertake"),
    canOvertake: Symbol("CanOvertake"),
    tried: Symbol("Tried"),
});

export default class Driver{

    constructor(color = "#000", track = null, name = "AA", stats = [], id){
        this.pos = {
            x: 0,
            y: 0,
        };

        //TODO add lap end publisher (and maybe corner made publisher) and
        //subscribe the current tyre to it
        this.color = color;
        this.track = track;
        this.name = name;
        this.trackPos = 0;
        this.absPos = 0;
        this.currCorner = 1;
        this.lap = 1;
        this.laptime = null;
        this.lastSpeedStats = null;
        //this.speedStats = new Statistic("Speed", 2, 10);
        //this.laptimeStats = new Statistic("Laptime", 1);
        //this.drag = new Statistic("Drag", 1, 10);
        this.telemetry = new Telemetry();

        this.selected = false;

        if(id == undefined)
            this.id = getNewID("driver");
        else
            this.id = id;

        this.tyres = null;
        this.fuel = 1;
        this.pushMode = 5;

        this.minSpeeds = [];
        this.brakingZones = [];

        this.braking = 10;
        this.acceleration = 10;
        this.drag = 0;
        this.isBraking = false;

        this.localTime = 0;
        this.realTime = 0;
        this.canOvertake = OvertakeStatus.cantOvertake;

        this.speed = 200;
        this.team = null;
        this.car = null;
        this.stats = stats;
        this.currSector = 0;
        this.adjusting = false;
        this.showBrakingZones = false;
        this.nextAdjustment = 0;
        this.currAdjustment = 0;
        this.ADJUSTMENT_STEP = 20;
    }

    draw(ctx, camera){
        DrawCircle(ctx, this.pos, this.color, 5, camera);
        DrawText(ctx, {x: 1400, y: 100}, "#000", 30, this.laptime.getLaptime());
        if(this.showBrakingZones)
            this.drawBrakingZones(ctx, camera);
        //this.drawCurvature(ctx);
        if(this.selected)
            this.telemetry.draw();
    }

    drawCurvature(ctx){
        let curvature = this.track.layout.getCurvature(this.track.layout.getParameterizedT(this.trackPos * this.track.conversionRatio));

        DrawText(ctx, {x: 1400, y: 200}, "#000", 30, curvature);

    }

    drawBrakingZones(ctx, camera){
        for(let i = 0; i < this.brakingZones.length; i++){
            if(this.track.corners[i].type == cornerTypes.straight)
                continue;

            let trackPos = this.track.getApex(i) - this.brakingZones[i];

            let pos = this.track.layout.getParameterizedPos(trackPos * this.track.conversionRatio);
            DrawCircle(ctx, pos, "#00f", 4, camera)
        }
    }

    update(deltaT){
        if(!deltaT) return;

        this.realTime += deltaT;

        while(this.localTime < this.realTime)
            this.updateDriver();

        this.pos = this.track.layout.getParameterizedPos(this.trackPos * this.track.conversionRatio);
    }

    setTeam(team){
        this.team = team;
        this.color = team.color;
    }

    createTempDriver(){
        let tempDriver = new Driver(undefined, undefined, undefined, undefined, this.id);

        tempDriver.track = this.track;
        tempDriver.trackPos = this.trackPos;
        tempDriver.absPos = this.absPos;

        tempDriver.tyres = this.tyres;
        tempDriver.fuel = this.fuel;
        tempDriver.pushMode = this.pushMode;

        tempDriver.minSpeeds = this.minSpeeds;

        tempDriver.speed = this.speed;
        tempDriver.team = this.team;
        tempDriver.car = this.car;
        tempDriver.stats = this.stats;
        tempDriver.currSector = this.currSector;
        tempDriver.acceleration = tempDriver.getAccValue();
        tempDriver.braking = tempDriver.getBrakingValue();
        tempDriver.adjusting = true;

        return tempDriver;

    }

    getAccValue(){
        //TODO: Add wet weather effect
        let traction = Math.pow(this.stats[StatNames.traction] / 100, 0.25 * ACC_STAT_EFFECT)/* * Math.pow(this.tyres.getTyreFactor(), 0.5)*/;

        let wheelSpinSpeed = WHEEL_SPIN_SPEED +  (35 * ACC_STAT_EFFECT) * (1 - Math.pow(this.tyres.getTyreFactor(), 0.5));

        let curvature = this.track.layout.getCurvature(this.track.layout.getParameterizedT(this.trackPos * this.track.conversionRatio));
        let accPotential = 1;
        let curvatureThreshold = 0.016 * Math.pow(this.tyres.getTyreFactor(), 2);
        if(Math.abs(curvature) >= curvatureThreshold)
            accPotential -= (Math.abs(curvature) * this.getCurvatureEffect(this.stats[StatNames.traction], ACC_STAT_EFFECT));
        accPotential = Math.max(accPotential, 0.1);

        if(this.speed >= wheelSpinSpeed)
            traction = 1 * accPotential;
        else{
            let lastSpeed = this.minSpeeds[this.currCorner - 1];
            
            if(this.speed < lastSpeed)
                lastSpeed = this.speed;

            let speedFactor = (this.speed - lastSpeed)/(wheelSpinSpeed - lastSpeed);
            if(speedFactor == NaN)
                speedFactor = 0;
            speedFactor = Math.max(speedFactor, 0.02);

            traction *= Math.pow(speedFactor, 0.5) * accPotential;
        }

        if(!this.adjusting)
            this.telemetry.logAccData(traction);

        return Math.max(traction, 0.1) * this.car.getAcc(this.speed);
    }

    getBrakingValue(){
        //TODO: Add wet weather effect (Scale lockupSpeed with it)
        let braking = Math.pow(this.stats[StatNames.braking] / 100, 0.5 * BRAKING_STAT_EFFECT) /** Math.pow(this.tyres.getTyreFactor(), 0.01)*/;
        
        let lockupSpeed = LOCKUP_SPEED + (35 * BRAKING_STAT_EFFECT) * ((100 - this.stats[StatNames.braking]) / 100) * (1 - Math.pow(this.tyres.getTyreFactor(), 0.1));

        let nextSpeed = this.minSpeeds[this.currCorner];

        let curvature = this.track.layout.getCurvature(this.track.layout.getParameterizedT(this.trackPos * this.track.conversionRatio));
        let brakingPotential = 1;
        let curvatureThreshold = 0.016 * Math.pow(this.tyres.getTyreFactor(), 2);
        if(Math.abs(curvature) >= curvatureThreshold)
            brakingPotential -= (Math.abs(curvature) * this.getCurvatureEffect(this.stats[StatNames.braking], BRAKING_STAT_EFFECT));
        brakingPotential = Math.max(brakingPotential, 0.1);

        if(this.speed > lockupSpeed)
            braking = 1 * brakingPotential;
        else{
            let speedFactor = (this.speed - nextSpeed)/(lockupSpeed - nextSpeed);
            if(speedFactor == NaN)
                speedFactor = 0;
            speedFactor = Math.max(speedFactor, 0);
            braking *= Math.pow(speedFactor, 0.5) * brakingPotential;
        }
                
        if(!this.adjusting)
            this.telemetry.logBrakingData(braking);

        return Math.max(braking, 0.05) * this.car.getBraking() * 3.6;
    }

    getCurvatureEffect(stat, effect){
        return Math.pow(this.speed/MAX_SPEED, 3) * (120 + (25 * effect) * ((100 - stat) / 100));
    }

    learnBraking(){
        let tempDriver = this.createTempDriver();
        tempDriver.brakingZones = [];

        //Add default braking zones
        tempDriver.brakingZones.push(0.0);
        for(let i = 1; i < this.track.corners.length; i++){
            if(this.track.corners[i].type == cornerTypes.straight){
                tempDriver.brakingZones.push(0.0);
                continue;
            }
            
            let speeddelta = (this.track.corners[i - 1].minSpeed - this.track.corners[i].minSpeed) / 3.6;

            if(speeddelta > 0){
                let dec = MAX_BRAKING;
                let time = Math.round((speeddelta / dec) * 100) / 100;
                let newBraking = (this.track.corners[i].minSpeed / 3.6) * time + 0.5 * dec * Math.pow(time, 2);
                newBraking -= 50;
                newBraking = Math.max(newBraking, 0);
                tempDriver.brakingZones.push(Math.round(newBraking * 100) / 100);
            }
            else{
                tempDriver.brakingZones.push(0.0);
            }
        }


        tempDriver.braking = tempDriver.getBrakingValue();
        tempDriver.currCorner = 1;
        tempDriver.speed = tempDriver.car.getTopSpeed();
        tempDriver.trackPos = 0;
        tempDriver.adjustBraking(10);



        /*
        for(let i = 1; i < this.track.corners.length; i++){
            tempDriver.currCorner = i;
            tempDriver.speed = Math.min(tempDriver.minSpeeds[i - 1], tempDriver.car.getTopSpeed());
            tempDriver.trackPos = tempDriver.track.getApex(i - 1);
            tempDriver.adjustBraking(200);

        }*/

        this.brakingZones = tempDriver.brakingZones;
    }

    //MaxRep - default 2, first learning - 20
    adjustBraking(maxRep){
        this.adjusting = true;
        let passed = false;
        let startingPos = this.trackPos;
        let startingAbsPos = this.absPos;
        let startingSpeed = this.speed;
        let startingAcc = this.acceleration;
        let startingBraking = this.braking;
        let startingDrag = this.drag;
        let rep = 0;
        let adjust = false;
        let unpredictability = 20;
        let coasted = false;
        let startingAdjustment = this.currAdjustment;
        let startingNextAdjustment = this.nextAdjustment;

        if(this.track.corners[this.currCorner].type == cornerTypes.straight)
            passed = true;


        while(!passed){
            if(this.trackPos >= this.track.getApex(this.currCorner) && this.currCorner != 0){
                if(this.speed > this.minSpeeds[this.currCorner]){
                    //Driver overshot corner
                    let speedDelta = Math.abs(this.speed - this.minSpeeds[this.currCorner]);
                    if(speedDelta < 1)
                        speedDelta = 0;
                    this.brakingZones[this.currCorner] += speedDelta / 5 + Math.random();
                    passed = false;
                }
                else{
                    if(rep > this.stats[StatNames.experience] / unpredictability)
                        passed = true;
                }


                this.speed = startingSpeed;
                this.acceleration = startingAcc;
                this.braking = startingBraking;
                this.trackPos = startingPos;
                this.absPos = startingAbsPos;
                this.nextAdjustment = startingNextAdjustment;
                this.currAdjustment = startingAdjustment;
                rep++;

                if(rep < maxRep)
                    adjust = true;

            }
            if(passed)
                break;

            coasted = this.moveDriver();

            if(coasted && adjust){
                adjust = false;
                this.brakingZones[this.currCorner] -= Math.random();
            }

            if(this.getDistance() <= 0){
                console.error("Braking zone is too long" + this.getDistance() + " " + this.brakingZones[this.currCorner]);
                if(this.currCorner != 0)
                    this.brakingZones[this.currCorner - 1] += 10;
                passed = true;
            }
            this.changeBrakeAccValues();

        }
        
        this.nextAdjustment = startingNextAdjustment;
        this.currAdjustment = startingAdjustment;
        this.braking = startingBraking;
        this.acceleration = startingAcc;
        this.drag = startingDrag;
        this.speed = startingSpeed;
        this.trackPos = startingPos;
        this.absPos = startingAbsPos;
        this.adjusting = false;
    }

    setCar(car){
        if(car == null)
            this.car = this.team.createCar(this.id);
    }

    initValues(){
        this.braking = this.getBrakingValue();
        this.acceleration = this.getAccValue();
        this.changeTyre(TyreCompounds.hard);
    }

    updateDriver(){
        //ADD OVERTAKING
        this.checkCornerApex();
        this.checkSectors();
        this.checkLapEnd();
        this.timeDriver();
        this.moveDriver();

        if(this.speedStats)
            this.speedStats.logData(this.speed, this.trackPos);

        this.laptime.update();
        this.localTime += TIMING_INTERVAL;

        //Avoid spinning cars

        //Evaluate overtaking

        //Evaluate crashing

        //Update acc and brake values
        this.changeBrakeAccValues();

    }

    changeBrakeAccValues(){
        if(this.currAdjustment < this.nextAdjustment){
            this.currAdjustment += TIMING_INTERVAL;
            return;
        }
        this.nextAdjustment += this.ADJUSTMENT_STEP;

        this.car.gearbox.changeGear(this.speed);
        
        if(!this.isBraking){
            if(!this.adjusting)
                this.telemetry.logBrakingData(0);
            this.acceleration = this.getAccValue();
        }
        else{
            if(!this.adjusting)
                this.telemetry.logAccData(0);
            this.braking = this.getBrakingValue();
        }

        this.calculateDrag();
    }

    moveDriver(){
        let coasted = false;
        //add drag maybe
        this.speed -= this.drag * (TIMING_INTERVAL / 1000);

        if(this.trackPos < this.getLength() || this.currCorner == 0){
            this.accelerate();
        }
        else if(!(this.speed < this.minSpeeds[this.currCorner])){
            this.brake();
        }
        else{
            //Coasting
            coasted = true;
        }

        this.speed = Math.max(this.speed, 0);
        let movement = (this.speed * (TIMING_INTERVAL / 1000)) / 3.6 ;
        this.trackPos += movement;

        this.absPos += movement;
        return coasted;
    }

    calculateDrag(){
        //Factor in air density
        this.dragEffect = (MAX_DRAG - DRAG_EFFECT * (Math.pow(this.car.getStat(cornerTypes.straight) / 100, 3))) * Math.pow((this.speed / MAX_SPEED), 2);

        if(!this.adjusting && this.drag)
            this.drag.logData(dragEffect, this.trackPos);
    }

    accelerate(){
        this.isBraking = false;
        this.speed = Math.min(this.speed + (this.acceleration * (TIMING_INTERVAL / 1000)), this.car.getTopSpeed());
        //ADD SLIPSTREAM
    }

    brake(){
        this.isBraking = true;
        if(this.speed > this.car.getTopSpeed())
            this.speed = this.car.getTopSpeed();
        this.speed -= this.braking * (TIMING_INTERVAL / 1000);
    }

    getLength(){
        return this.track.getApex(this.currCorner) - this.brakingZones[this.currCorner];
    }

    getDistance(){
        return this.track.getApex(this.currCorner) - this.brakingZones[this.currCorner] - this.track.getApex(this.currCorner - 1);
    }

    checkCornerApex(){
        let cornerType = this.track.corners[this.currCorner].type;

        if(this.trackPos >= this.track.getApex(this.currCorner) && this.currCorner != 0){
            if(this.speed > this.minSpeeds[this.currCorner] + 1){
                let speedDelta = Math.abs(this.speed - this.minSpeeds[this.currCorner]);
                console.log(this.name + " has run wide at corner " + this.currCorner + " " + speedDelta);
                this.speed = this.minSpeeds[this.currCorner];
                this.speed -= speedDelta * 1;
                this.brakingZones[this.currCorner] += 2;
            }

            //Evaluate mistake
            if(cornerType != cornerTypes.straight){
                //TODO: pass correct race length
                this.tyres.degradeTyre(this.track.deg, 2, this.team.deg, cornerType, this.stats[StatNames.smoothness], this.pushMode);
                this.acceleration = this.getAccValue();
                this.braking = this.getBrakingValue();
            }
            else{
                //Burn fuel (apparently)
            }

            this.currCorner = (this.currCorner + 1) % this.track.corners.length;

            //Manage push mode maybe

            cornerType = this.track.corners[this.currCorner].type;
            if(cornerType != cornerTypes.straight){
                //Checking if driver isn't already adjusting
                this.setMinSpeedSingle(this.currCorner);
                
                if(!this.adjusting)
                    this.adjustBraking(2);
            }

            this.canOvertake = OvertakeStatus.cantOvertake;     
        }
    }

    timeDriver(){
        //Timing for calculating gaps
    }

    checkLapEnd(){
        if(this.trackPos >= this.track.length){
            this.trackPos -= this.track.length;
            this.lapEnded();
            this.laptime = new Laptime(this.tyres);
        }
    }

    checkSectors(){
        //Save sector times (Probably make Laptime class)
        if(this.trackPos > this.track.sectors[this.currSector])
        {
            console.log(this.name + " Sector " +  (this.currSector + 1) + " " + this.laptime.getLaptime());
            this.currSector++;
            this.currSector = this.currSector % this.track.sectors.length;
        }
    }

    lapEnded(){
        console.log(this.name + " " + this.laptime.getLaptime());
        this.tyres.ageTyres();
        this.lap++;
        this.currSector = 0;
        this.currCorner = 1;

        this.logStatistics();
        


        //TODO: Strategy stuff
        //Calculate last lap
        //TODO: check penalties
        //TODO: check for race end
    }

    logStatistics(){
        if(this.lastSpeedStats != null)
            this.lastSpeedStats.closeData();
        if(this.lastDrag)
            this.lastDrag.closeData();
        if(this.drag){
            this.drag.printData();
            this.lastDrag = this.drag;
            this.drag = new Statistic("Drag", 1, 10);
        }

        if(this.speedStats){
            this.speedStats.printData();
            this.lastSpeedStats = this.speedStats;
            this.speedStats = new Statistic("Speed", 0, 10);
        }
        if(this.laptimeStats){
            this.laptimeStats.logData(this.laptime.time / 1000);
            this.laptimeStats.closeData();
            this.laptimeStats.printData();
        }
    }

    changeTyre(tyre){
        let toChange = this.track.tyreCompounds[tyre];

        this.tyres = new Tyre(toChange.type, toChange.name, toChange.grip, toChange.heating, toChange.wearRate, toChange.wetWeatherPerformance);
    }

    getFuelFactor(){
        let fuelFactor = 0;
        if(this.fuel > 0)
            fuelFactor = 1 - (this.fuel / this.track.laps) / 6;
        else
            fuelFactor = 0.4;
        return fuelFactor;
    }

    setMinSpeedSingle(corner){
        if(this.track.corners[corner].type == cornerTypes.straight){
            this.minSpeeds[corner] = MAX_SPEED;
            return;
        }

        if(!this.track.isRaining && this.track.water <= 0){

            let fuelFactor = this.getFuelFactor();
            //TODO Add handling factor
            let handlingFactor = 0;
            let tyreFactor = this.tyres.getTyreFactor();
            let cornerType = this.track.corners[corner].type;

            this.minSpeeds[corner] = this.track.corners[corner].minSpeed;

            //Car stats
            this.minSpeeds[corner] *= Math.pow(this.car.getStat(cornerType) / 100, CAR_EFFECT);
            //Handling
            this.minSpeeds[corner] *= Math.pow(1 - handlingFactor, 0.03);
            //Driver cornering stat
            this.minSpeeds[corner] *= Math.pow(this.stats[StatNames.cornering] / 100, CORNERING_STAT_EFFECT);
            //Tyre factor
            this.minSpeeds[corner] *= tyreFactor;
            //Push mode
            this.minSpeeds[corner] *= (0.995 + this.pushMode / 200);
            //Track grip
            this.minSpeeds[corner] *= Math.pow(this.track.grip / 100, 0.33);
            //Add car handling and track characteristic factors
            if(this.track.session != SessionNames.practice)
                this.minSpeeds[corner] *= fuelFactor;
            

        }
        else{
            //TODO Add wet weather calculation
        }

    }

    setMinSpeeds(){
        this.changeTyre(TyreCompounds.soft);

        for(let i = 0; i < this.track.corners.length; i++){
            this.setMinSpeedSingle(i);
        }
    }

    resetTime(){
        this.localTime = 0;
        this.laptime = new Laptime(this.tyres);
        this.realTime = 0;
    }

}