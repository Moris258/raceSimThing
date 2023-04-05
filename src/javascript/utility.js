//Converts time in seconds into a readable string
export function ConvertLapTime(time){
    let tempTime = time;
    let length = 0;
    while(tempTime / 60 > 1 && length < 2){
        tempTime /= 60;
        length++;
    }

    tempTime = time;
    let lapTime = "";

    for(let i = length; i >= 0; i--){
        let amount = Math.floor(tempTime / Math.pow(60, i))
        if(amount < 10 && i < 2 && i != length)
            lapTime += "0";

        lapTime += amount;
        lapTime += ":";
        tempTime -= Math.floor(tempTime / Math.pow(60, i)) * Math.pow(60, i);
    }
    tempTime *= 1000;
    tempTime = Math.round(tempTime);
    tempTime /= 1000;

    for(let i = 0; i < 3; i++)
    {
        tempTime *= 10;
        if(tempTime < 1)
            lapTime += Math.floor(tempTime);
    }
    lapTime += Math.floor(tempTime);

    return lapTime;
}

export function DownloadFile(jsonData, fileName){        
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([jsonData], {
      type: "text/plain"
    }));
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function DrawCircle(ctx, pos, color, size, camera = null){
    let cameraPos = {
        x: 0,
        y: 0,
    };
    
    if(camera != null) cameraPos = camera.pos;


    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x - cameraPos.x, pos.y - cameraPos.y, size, 0, Math.PI * 2);   
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
}

export function DrawText(ctx, pos, color, size, text, camera = null){
    let cameraPos = {
        x: 0,
        y: 0,
    };
    
    if(camera != null) cameraPos = camera.pos;

    ctx.font = size + "px Arial";
    ctx.fillStyle = color;
    //ctx.textAlign = "center";
    ctx.fillText(text, pos.x - cameraPos.x, pos.y - cameraPos.y);
}

export function drawLine(ctx, p1, p2, color, thickness){
    ctx.fillStyle = color;
    ctx.lineWidth = thickness;
    ctx.borderColor = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

export function IsInRect(pos, boxPos, boxWidth, boxHeight){
    if(pos.x >= boxPos.x && pos.x <= boxPos.x + boxWidth && pos.y >= boxPos.y && pos.y <= boxPos.y + boxHeight)
        return true;
    return false;
}

let driverID = 0;
let teamID = 0;

export function getNewID(type){
    switch(type){
        case "driver":
            return driverID++;
        case "team":
            return teamID++;
    }
}

export function checkDistance(pos1, pos2, tolerance){
    if(pos1.x >= pos2.x - tolerance && pos1.x <= pos2.x + tolerance){
        if(pos1.y >= pos2.y - tolerance && pos1.y <= pos2.y + tolerance){
            return true;
        }
    }
    return false;
}

export async function loadJSONFile(path){
    
    let response = await fetch(path);
    return await response.json();
}

export default class TextDisplayHandler{
    constructor() {
        this.pos = {
            x: 0,
            y: 0,
        };


        this.duration = 0;
        this.text = "";
        this.displaying = false;
        this.color = "#000";
    }

    //Displays text for duration in ms
    displayText(duration, text, color, pos){
        this.text = text;
        this.duration = duration;
        this.displaying = true;
        this.color = color;
        this.pos = pos;
    }

    draw(ctx, camera){
        if(!this.displaying) return;

        ctx.font = "20px Arial";
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.pos.x, this.pos.y);

    }

    update(deltaT){
        if(!this.displaying) return;

        this.duration -= deltaT;
        if(this.duration <= 0)
        {
            this.displaying = false;
        }
    }
}

export const carTypes = {
    Formula: ["FrontWing", "RearWing", "Chassis", "Underbody", "Suspension"],
}

export const statTypes = ["lowSpeed", "mediumSpeed", "highSpeed", "topSpeed", "reliability"];

export const MAX_SPEED = 350;
export const MIN_SPEED = 80;
export const MAX_CORNER_SPEED = 350;
export const MAX_DRAG = 25;
export const DRAG_EFFECT = MAX_DRAG - 10;
export const MAX_BRAKING = 42.5;
export const LOCKUP_SPEED = 160;
export const WHEEL_SPIN_SPEED = 130;

export const TIMING_INTERVAL = 1;
