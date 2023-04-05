import InputHandlerPlay from "./inputHandlerPlay.js";
import { TyreCompounds } from "./tyre.js";
import { DrawText, IsInRect } from "./utility.js";


class TimingTower{
    constructor() {
        this.TIMING_TOWER_X = 50;
        this.TIMING_TOWER_Y = 50;
        this.FIRST_DRIVER_X = 55;
        this.FIRST_DRIVER_Y = 80;
        this.TIMING_TOWER_HEIGHT = 1000;
        this.TIMING_TOWER_WIDTH = 200;
        this.MAX_DRIVERS = 20;
        this.GAP_Y = this.TIMING_TOWER_HEIGHT / this.MAX_DRIVERS;

        new InputHandlerPlay(this);

        this.drivers = [];
        this.selectedDriver = null;
    }

    setDrivers(drivers){
        this.drivers = drivers;
        this.unselectDriver();
    }
    
    draw(ctx, camera){
        ctx.fillStyle = "rgba(5, 5, 5, 0.5)";
        ctx.fillRect(this.TIMING_TOWER_X, this.TIMING_TOWER_Y, this.TIMING_TOWER_WIDTH, this.TIMING_TOWER_HEIGHT);
        let posx = this.FIRST_DRIVER_X;
        let posy = this.FIRST_DRIVER_Y;

        this.drivers.forEach(element => {
            if(element.selected){
                ctx.fillStyle = "rgba(40, 40, 40, 0.5)";
                ctx.fillRect(this.TIMING_TOWER_X, posy - (this.GAP_Y / 2), this.TIMING_TOWER_WIDTH, this.GAP_Y);
            }

            DrawText(ctx, {x: posx, y: posy}, element.color, 20, element.name + ": " + element.laptime.getLaptime());
            posy += this.GAP_Y;
        });
    }

    unselectDriver(){
        if(this.selectedDriver)
            this.selectedDriver.selected = false;
        this.selectedDriver = null;
    }

    selectDriver(driver){
        this.unselectDriver();
        this.selectedDriver = driver;
        driver.selected = true;
    }

    checkSelectDriver(pos){
        if(pos.y < this.TIMING_TOWER_Y || pos.y > this.TIMING_TOWER_HEIGHT + this.TIMING_TOWER_Y || pos.x < this.TIMING_TOWER_X || pos.x > this.TIMING_TOWER_WIDTH + this.TIMING_TOWER_X){
            this.unselectDriver();
            return;
        }

        let posx = this.FIRST_DRIVER_X;
        let posy = this.FIRST_DRIVER_Y - this.GAP_Y/2;

        for(let i = 0; i < this.drivers.length; i++){
            let boxPos = {
                x: posx,
                y: posy
            };
            if(IsInRect(pos, boxPos, this.TIMING_TOWER_WIDTH, this.GAP_Y)){
                this.selectDriver(this.drivers[i]);
                break;
            }
            posy += this.GAP_Y;
        }
    }
}

export default class Series{
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT, name){
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        
        this.timingTower = new TimingTower();

        //TODO: define handling characteristics of series car

        this.GAME_SPEED = 1;
        this.name = name;

        this.track = null;
        this.drivers = [];
        this.teams = [];

        this.drawables = [];
        this.updatables = [];
        this.drawables.push(this.timingTower);

    }

    draw(ctx, camera){
        this.drawables.forEach(element => {
            element.draw(ctx, camera);
        });
    }


    update(deltaT){
        this.sortDrivers();
        this.updatables.forEach(element => {
            element.update(deltaT);
        });
    }

    sortDrivers(){
        this.drivers.sort((a, b) => {
            return b.absPos - a.absPos;
        });
    }

    setDrivers(drivers){
        this.drivers.forEach(element => {
            this.drawables.splice(this.drawables.indexOf(element, 1));
            this.updatables.splice(this.updatables.indexOf(element, 1));
        });
        this.drivers = drivers;
        this.drivers.forEach(element => {
            this.drawables.push(element);
            this.updatables.push(element);
        });
        this.timingTower.setDrivers(drivers);
    }

    initializeDrivers(){
        this.drivers.forEach(element => {
            element.setCar(null);
            element.setMinSpeeds();
            element.initValues();
            element.resetTime();
        })
    }

    learnBraking(){
        this.drivers.forEach(element => {
            element.learnBraking();
        });
    }

    setTeams(teams){
        this.teams = teams;
    }

    setTrack(track){
        if(this.track){
            this.drawables.splice(this.drawables.indexOf(this.track, 1));
            this.updatables.splice(this.updatables.indexOf(this.track), 1);
        }
        this.track = track;
        this.drawables.push(this.track);
        this.updatables.push(this.track);
    }

}