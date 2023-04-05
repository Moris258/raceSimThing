import { drawLine, DrawText } from "./utility.js";

export class Telemetry{
    constructor() {
        this.TELEMETRY_LENGTH = 200;
        this.CANVAS_WIDTH = 800;
        this.CANVAS_HEIGHT = 600;

        this.brakingVals = [];
        this.accVals = [];
        this.brakingColor = "#f00";
        this.accColor = "#0f0";


        for(let i = 0; i < this.TELEMETRY_LENGTH; i++){
            this.brakingVals.push(0);
            this.accVals.push(0);
        }

        this.canvas = document.getElementById("telemetryCanvas");   
        this.ctx = this.canvas.getContext("2d");
    }

    logAccData(acc){
        this.accVals.push(acc);
        if(this.accVals.length > this.TELEMETRY_LENGTH)
            this.accVals.splice(0, 1);
    }

    logBrakingData(braking){
        this.brakingVals.push(braking);
        if(this.brakingVals.length > this.TELEMETRY_LENGTH)
            this.brakingVals.splice(0, 1);
    }

    draw(){
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        this.drawData(this.ctx, this.brakingVals, this.brakingColor);
        this.drawData(this.ctx, this.accVals, this.accColor);
    }

    drawData(ctx, data, color){
        let posx = 0;
        let increment = this.CANVAS_WIDTH / this.TELEMETRY_LENGTH;


        for(let i = 0; i < this.TELEMETRY_LENGTH - 1; i++){

            let pos1 = {
                x: posx,
                y: this.CANVAS_HEIGHT - data[i] * this.CANVAS_HEIGHT
            };
            let pos2 = {
                x: posx + increment,
                y: this.CANVAS_HEIGHT - data[i + 1] * this.CANVAS_HEIGHT
            }

            drawLine(ctx, pos1, pos2, color, 3);

            posx += increment;
        }
    }
}

export default class Statistic{
    constructor(name, statCount, entryDelta = 1) {
        this.name = name;
        this.entryDelta = entryDelta;
        this.lastLog = 0;
        this.statCount = statCount;

        this.CANVAS_WIDTH = 2000;
        this.CANVAS_HEIGHT = 600;
        this.N_OF_H_LINES = 20;

        this.data = [];
        this.canvas = null;
    }

    logData(data, pos){
        if(pos < this.lastLog) return;

        this.data.push(data);
        this.lastLog += this.entryDelta;
    }

    printData(){
        this.canvas = document.createElement("canvas");
        this.canvas.style.position = "absolute";
        this.canvas.style.border = "1px solid";
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;
        this.canvas.style.top = (this.statCount * (this.CANVAS_HEIGHT+ 20) + 20) + "px";
        this.canvas.style.left = "1650px"

        let ctx = this.canvas.getContext("2d");
        let maxValue = Math.max(...this.data);
        let minValue = Math.min(...this.data);
        let currentX = 0;
        let topMargin = 10;
        let bottomMargin = 10;
        let totalWidth = (this.data.length - 1) * this.entryDelta;

        console.log(this.name + ": " + maxValue);
        console.log(this.name + ": " + minValue);

        DrawText(ctx, {x: this.CANVAS_WIDTH - 150, y: this.CANVAS_HEIGHT - 20}, "#f00", 20, this.name);

        let actualHeight = this.CANVAS_HEIGHT - topMargin - bottomMargin;

        for(let i = 0; i < this.data.length - 1; i++){
            let point1 = this.data[i] - minValue;
            let point2 = this.data[i + 1] - minValue;

            let pos1 = {x: currentX/totalWidth * this.CANVAS_WIDTH, y: this.CANVAS_HEIGHT - (point1 / (maxValue - minValue) * actualHeight) - bottomMargin};
            let pos2 = {x: (currentX + this.entryDelta)/totalWidth * this.CANVAS_WIDTH, y: this.CANVAS_HEIGHT - (point2 / (maxValue - minValue) * actualHeight) - bottomMargin};
            drawLine(ctx, pos1, pos2, "#444", 1);
            currentX += this.entryDelta;
        }

        //There is only 1 dataPoint
        if(this.data.length == 1){
            let point1 = this.data[0];
            let point2 = this.data[1];
            let pos1 = {x: 0 * this.CANVAS_WIDTH, y: this.CANVAS_HEIGHT * 0.5};
            let pos2 = {x: 1 * this.CANVAS_WIDTH, y: this.CANVAS_HEIGHT * 0.5};
            drawLine(ctx, pos1, pos2, "#444", 1);
        }

        let temp = (maxValue - minValue) / this.N_OF_H_LINES;
        let rounding = 0;

        if(temp != 0){
            while(temp < 10)
            {
                temp *= 10;
                rounding--;
            }
            while(temp >= 100){
                temp /= 10;
                rounding++;
            }
        }
        
        rounding = Math.pow(10, rounding);

        for(let i = 0; i < this.N_OF_H_LINES; i++){
            let position = {x: 10, y: (i) * (actualHeight / this.N_OF_H_LINES) + topMargin};
            let value = ((this.N_OF_H_LINES -(i)) / this.N_OF_H_LINES) * (maxValue - minValue);
            value += minValue;
            value = Math.round(value / rounding)  * rounding;
            DrawText(ctx, position, "#000", 10, "- " + value);
        }

        document.body.appendChild(this.canvas);
    }

    closeData(){
        if(this.canvas != null)
            document.body.removeChild(this.canvas);
    }

}