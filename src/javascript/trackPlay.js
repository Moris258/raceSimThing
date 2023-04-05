import Tyre, { TyreCompounds } from "./tyre.js";
import { DrawCircle, loadJSONFile } from "./utility.js";

export const cornerTypes = Object.freeze({
    straight: "straight",
    lowSpeed: "lowSpeed",
    mediumSpeed: "mediumSpeed",
    highSpeed: "highSpeed",
});

export const SessionNames = Object.freeze({
    practice: "Practice",
    quali: "Qualifying",
    race: "Race",
});

const TyreAllocation = Object.freeze({
    hard: "Hard",
    medium: "Medium",
    soft: "Soft",
});



export default class Track{
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT, spline) {
        this.layout = spline;
        this.name = "";
        this.deg = 0;
        this.pitDelta = 0;
        this.speedLimit = 0;
        this.slipstream = 0;
        this.grip = 100;
        this.temperature = 0;
        this.laps = 0;
        this.session = SessionNames.race;


        this.length = 1;
        this.apexes = [];
        this.minSpeeds = [];
        this.sectors = [];
        this.corners = [];
        this.cornerApexes = [];

        this.isRaining = false;
        this.water = 0;

        this.tyreCompounds = [];


        this.showApexes = false;
        this.conversionRatio = 1.0;
    }

    draw(ctx, camera){
        this.layout.draw(ctx, camera);
        if(this.showApexes)
            this.drawApexes(ctx, camera);
    }

    drawApexes(ctx, camera){
        for(let i = 0; i < this.cornerApexes.length; i++){

            let pos = this.layout.getParameterizedPos(this.cornerApexes[i] * this.conversionRatio);
            DrawCircle(ctx, pos, "#f00", 5, camera);
        }
    }

    update(deltaT){
    }

    setConversionRatio(){
        this.conversionRatio = this.layout.totalLength / this.length;
    }

    getApex(index){
        if(index >= this.cornerApexes.length) return -1;

        return this.cornerApexes[index];
    }

    setApexes(){
        for(let i = 0; i < this.corners.length; i++)
            this.cornerApexes.push(this.calculateApex(i));
        console.log(this.cornerApexes);
    }

    calculateApex(corner){
        let length = 0.0;
        for(let i = 0; i < corner; i++){
            length += this.corners[i].length;
        }

        if(this.corners[corner].type != cornerTypes.straight){
            let actCorner = 0;
            for(let i = 0; i < corner; i++)
                if(this.corners[i].type != cornerTypes.straight)
                    actCorner++;
            length = this.apexes[actCorner].apex;
        }
        else if(this.corners[(corner + 1) % this.corners.length].type == cornerTypes.straight)
            length += this.corners[corner].length - 10;
        else
        {
            if(this.corners[corner].length > 200)
                length += this.corners[corner].length - 200;
            else
                length += this.corners[corner].length / 2;
        }

        return length;
    }

    scaleLengths(){

        //Scale sectors and set last sector equal to length of lap
        for(let i = 0; i < this.sectors.length; i++)
            this.sectors[i] = Math.round(this.sectors[i] / this.conversionRatio);
        this.sectors[this.sectors.length - 1] = this.length;

        for(let i = 0; i < this.apexes.length; i++){
            let apex = this.apexes[i];
            
            apex.apex = Math.round(apex.apex / this.conversionRatio);
            apex.entry = Math.round(apex.entry / this.conversionRatio);
            apex.exit = Math.round(apex.exit / this.conversionRatio);
        }
    }

    chooseTyreCompounds(type){
        this.tyreCompounds = [];
        switch(type){
            case TyreAllocation.soft:
                this.tyreCompounds.push(new Tyre(TyreCompounds.hard, "Hard", 100, 3, 5.5, 10));
                this.tyreCompounds.push(new Tyre(TyreCompounds.medium, "Medium", 100, 4, 10, 15));
                this.tyreCompounds.push(new Tyre(TyreCompounds.soft, "Soft", 100, 5, 16.5, 20));
                this.tyreCompounds.push(new Tyre(TyreCompounds.intermediate, "Intermediate", 45, 3, 10, 60));
                this.tyreCompounds.push(new Tyre(TyreCompounds.wet, "Wet", 30, 3, 6, 100));
                break;
            case TyreAllocation.medium:
                this.tyreCompounds.push(new Tyre(TyreCompounds.hard, "Hard", 100, 3, 5, 5));
                this.tyreCompounds.push(new Tyre(TyreCompounds.medium, "Medium", 100, 4, 9.5, 10));
                this.tyreCompounds.push(new Tyre(TyreCompounds.soft, "Soft", 100, 5, 16, 15));
                this.tyreCompounds.push(new Tyre(TyreCompounds.intermediate, "Intermediate", 45, 3, 10, 60));
                this.tyreCompounds.push(new Tyre(TyreCompounds.wet, "Wet", 30, 3, 6, 100));
                break;
            case TyreAllocation.hard:
                this.tyreCompounds.push(new Tyre(TyreCompounds.hard, "Hard", 100, 3, 4.5, 0));
                this.tyreCompounds.push(new Tyre(TyreCompounds.medium, "Medium", 100, 4, 9, 5));
                this.tyreCompounds.push(new Tyre(TyreCompounds.soft, "Soft", 100, 5, 15.5, 10));
                this.tyreCompounds.push(new Tyre(TyreCompounds.intermediate, "Intermediate", 45, 3, 10, 60));
                this.tyreCompounds.push(new Tyre(TyreCompounds.wet, "Wet", 30, 3, 6, 100));
                break;
        }
    }

    createCorners(){
        //Generate first straight
        let straightLength = this.apexes[0].entry;
        this.corners.push(new Corner(cornerTypes.straight, straightLength, 400, 0));
        

        for(let i = 0; i < this.apexes.length; i++){
            let cornerLength = this.apexes[i].exit - this.apexes[i].entry;
            this.corners.push(new Corner(this.getCornerType(this.minSpeeds[i]), cornerLength, this.minSpeeds[i], 5));

            if(i == this.apexes.length - 1){
                //Generate final straight
                this.corners.push(new Corner(cornerTypes.straight, this.length - this.apexes[i].exit, 400, 0));
                return;
            }
            
            let interimLength = this.apexes[i + 1].entry - this.apexes[i].exit;
            if(interimLength > 0){
                //Generate straight
                this.corners.push(new Corner(cornerTypes.straight, interimLength, 400, 0));
            }
        }


    }

    getCornerType(minSpeed){
        const LSC_SPEED = 140;
        const MSC_SPEED = 250;
        const HSC_SPEED = 350;

        if(minSpeed < LSC_SPEED)
            return cornerTypes.lowSpeed;
        else if(minSpeed < MSC_SPEED)
            return cornerTypes.mediumSpeed;
        else if(minSpeed < HSC_SPEED)
            return cornerTypes.highSpeed;
        else
            return cornerTypes.straight;

    }

    calculateLaps(){
        //Add different race lengths
        let raceLength = 305.0 / 2.0;
        this.laps = Math.ceil(raceLength / (this.length / 1000));
    }

    async loadLayout(path){
        let jsondata = await loadJSONFile(path);
        this.layout.controlPoints = jsondata.spline;
        this.name = jsondata.name;
        this.apexes = jsondata.apexes;
        this.sectors = jsondata.sectors;
        this.length = parseInt(jsondata.trackLength);
        this.temperature = parseInt(jsondata.trackTemp);
        this.deg = parseInt(jsondata.trackDeg);
        this.pitDelta = parseInt(jsondata.pitDelta);
        this.slipstream = parseInt(jsondata.slipstream);
        this.speedLimit = parseInt(jsondata.speedLimit);
        this.minSpeeds = jsondata.minSpeeds;

        this.layout.setLengths();

        this.setConversionRatio();
        this.scaleLengths();
        this.createCorners();
        this.chooseTyreCompounds(TyreAllocation.hard);
        this.calculateLaps();
        this.setApexes();

        this.layout.loaded = true;
    }
}

class Corner{
    constructor(type, length, minSpeed, overtake_diff){
        this.type = type;
        this.length = length;
        this.minSpeed = minSpeed;
        this.overtake_diff = overtake_diff;
    }
}