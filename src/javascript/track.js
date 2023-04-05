import InputHandler from "./inputHandler.js";
import TextDisplayHandler, { checkDistance, DownloadFile, DrawCircle, DrawText, MAX_CORNER_SPEED, MAX_SPEED, MIN_SPEED } from "./utility.js";

export const pointTypes = {
    Apex: "apex",
    Entry: "entry",
    Exit: "exit",
    Sector: "sector",
    None: "none",
};

class DraggablePoint{
    constructor(pos, spline, description, color, selectedColor, type) {
        this.pos = pos;
        this.type = type;
        this.spline = spline;
        this.color = color;
        this.selectedColor = selectedColor;
        this.isSelected = false;
        this.description = description;
    }

    movePoint(pos){
        let bestMatch = this.findBestMatch(pos);
        this.pos = bestMatch;
    }

    remove(){
        return this;
    }

    draw(ctx){
        let color = this.color;
        if(this.isSelected)
            color = this.selectedColor;
        let point = this.spline.getParameterizedPos(this.pos);

        DrawCircle(ctx, point, color, 5);
        DrawText(ctx, {x: point.x - 6, y: point.y - 10}, "#000", 20, this.description);
    }

    checkPoint(pos){
        let point = this.spline.getParameterizedPos(this.pos);
        this.isSelected = checkDistance(point, pos, 10)
        if(this.isSelected)
            return this;
        else
            return null;
    }

    unselectPoint(){
        this.isSelected = false;
    }

    findBestMatch(pos){
        let bestMatchDistance = -1;
        let next = 0.0;
        let step = 1.0;
        let bestMatch = 0.0;

        while(next + step < this.spline.totalLength){
            let nextPos = this.spline.getParameterizedPos(next);

            let distance = Math.sqrt(Math.pow(pos.x - nextPos.x, 2) + Math.pow(pos.y - nextPos.y, 2));

            if(distance < bestMatchDistance || bestMatchDistance == -1)
            {
                bestMatchDistance = distance;
                bestMatch = next;
            }

            next += step;
        }
        return bestMatch;
    }

}

class EntryExitPoint extends DraggablePoint{
    constructor(pos, spline, description, color, selectedColor, type, parent) {
        super(pos, spline, description, color, selectedColor, type);
        this.parent = parent;
    }

    remove(){
        return this.parent;
    }
}

class ApexPoint extends DraggablePoint{
    constructor(pos, spline, description, color = "#f00", selectedColor = "#00f", type = pointTypes.Apex) {
        super(pos, spline, description, color, selectedColor, type);
        this.entry = new EntryExitPoint(pos - 50, spline, "", "#000", "#000", pointTypes.Entry, this);
        this.exit = new EntryExitPoint(pos + 50, spline, "", "#000", "#000", pointTypes.Exit, this);
        this.fixApex();
    }

    movePoint(pos){
        if(!this.isSelected) return;

        let bestMatch = this.findBestMatch(pos);

        let distanceAhead = (this.exit.pos - this.pos) % this.spline.totalLength;
        let distanceBehind = (this.pos - this.entry.pos) % this.spline.totalLength;

        this.exit.pos = bestMatch + distanceAhead;
        this.entry.pos = bestMatch - distanceBehind;
        
        this.fixApex();

        this.pos = bestMatch;

    }

    checkPoint(pos){
        let found = (super.checkPoint(pos) != null);

        if(found) return this;

        found = (this.exit.checkPoint(pos) != null);

        if(found){
            this.isSelected = true;
            return this.exit;
        }

        found = (this.entry.checkPoint(pos) != null);

        if(found){
            this.isSelected = true;
            return this.entry;
        }

    }

    unselectPoint(){
        this.isSelected = false;
        this.entry.unselectPoint();
        this.exit.unselectPoint();
    }

    draw(ctx){
        if(this.isSelected){
            this.spline.drawSplineRange(ctx, this.entry.pos, this.exit.pos, "#ff0");
            this.entry.draw(ctx);
            this.exit.draw(ctx);
            super.draw(ctx);
        }
        else{
            super.draw(ctx);
        }
    }

    fixApex(){
        if(this.exit.pos < 0)
            this.exit.pos += this.spline.totalLength;
        if(this.exit.pos > this.spline.totalLength)
            this.exit.pos -= this.spline.totalLength;

        if(this.entry.pos < 0)
            this.entry.pos += this.spline.totalLength;
        if(this.entry.pos > this.spline.totalLength)
            this.entry.pos -= this.spline.totalLength;
    }
}

export class PointManager{
    constructor(spline) {
        this.points = [];
        this.selectedPoint = null;
        this.isDragging = false;
        this.locked = false;
        this.spline = spline;
        this.showApexes = true;
    }

    draw(ctx){
        /*
        if(this.showApexes)
            this.drawStatus(ctx);*/
        if(this.showApexes)
            this.drawPoints(ctx);
    }

    drawPoints(ctx){
        this.points.forEach(element => {
            element.draw(ctx);
        });
    }

    drawStatus(ctx){
        if(this.locked && this.spline.locked)
            DrawText(ctx, {x: 50, y: 20}, "#000", 20, "Locked");
        else if(!this.locked)
            DrawText(ctx, {x: 100, y: 20}, "#000", 20, "Editing apexes");
        else
            DrawText(ctx, {x: 100, y: 20}, "#000", 20, "Editing spline");

    }

    addPoint(type){
        if(this.locked) return;
        switch(type){
            case pointTypes.Apex:
                this.points.push(new ApexPoint(10, this.spline, 1));
                break;
            case pointTypes.Sector:
                this.points.push(new DraggablePoint(10, this.spline, 1, "#ddd", "#aaa", pointTypes.Sector));
                break;
        }
    }

    movePoint(pos){
        if(this.locked || !this.isDragging || this.selectedPoint == null) return;

        this.selectedPoint.movePoint(pos);
    }

    dragPoint(pos){
        if(this.locked) return;
        if(this.selectedPoint != null) this.selectedPoint.unselectPoint();

        this.selectedPoint = null;
        for(let i = 0; i < this.points.length; i++){
            this.selectedPoint = this.points[i].checkPoint(pos);
            if(this.selectedPoint != null)
                break;
        }
        this.isDragging = true;
    }

    removePoint(){
        if(this.locked) return;
        if(this.selectedPoint == null) return;
        
        this.points.splice(this.points.indexOf(this.selectedPoint.remove()), 1);

        this.selectedPoint = null;
    }

    //TODO: FIX THIS PLS
    shiftApexes(){
        if(this.spline.locked) return;

        /*
        let splineLength = this.spline.totalLength;

        for(let i = 0; i < this.apexes.length; i++){
            let currApex = this.apexes[i];

            if(currApex.apex.pos > splineLength){
                this.apexes.splice(this.apexes.indexOf(currApex), 1);
            }
        }*/
    }

    resetDraggedPoint(){
        this.isDragging = false;
    }

    toggleShowApexes(){
        this.showApexes = !this.showApexes;/*
        if(this.showApexes)
            this.textDisplayHandler.displayText(1000, "Showing apexes", "#000", {x: 1500, y: 1180});
        else 
            this.textDisplayHandler.displayText(1000, "Hiding apexes", "#000", {x: 1500, y: 1180});*/
    }

    toggleTrackLock(){
        this.locked = !this.locked;

        /*
        if(this.locked)
            this.textDisplayHandler.displayText(1000, "Apexes locked", "#000", {x: 1500, y: 1180});
        else 
            this.textDisplayHandler.displayText(1000, "Apexes unlocked", "#000", {x: 1500, y: 1180});*/

        this.isDragging = false;
        this.selectedPoint = null;
    }
}

export default class Track{
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT, spline, image) {

        this.layout = spline;
        this.length = 0;
        this.inputHandler = new InputHandler(this.layout, this);

        this.drawables = [];
        this.drivers = [];
        this.drawables[this.drawables.length] = this.layout;
        this.updatables = [];



        /*
        this.apexes = [];
        this.sectors = [];
        this.draggablePoints = [];

        this.draggedPoint = -1;
        this.draggedPointType = pointTypes.None;
        this.selectedPointType = pointTypes.None;
        this.selectedPoint = -1;*/

        this.locked = !this.layout.locked;
        this.showApexes = true;
        this.trackImage = image;
        this.showTrace = false;
        this.textDisplayHandler = new TextDisplayHandler();
        this.drawables.push(this.textDisplayHandler);
        this.updatables.push(this.textDisplayHandler);
    }

    /*
    dragPoint(pos){
        if(this.locked) return;

    }

    addPoint(type){
        
    }

    removePoint(){
        
    }

    resetDraggedPoint(){
        this.isDragging = false;
    }*/

    draw(ctx, camera){
        if(this.showTrace)
            ctx.drawImage(this.trackImage, 0 + camera.pos.x, 0 + camera.pos.y);
        this.drawables.forEach(element => {
            element.draw(ctx, camera);
        });
    }

    update(deltaT){
        this.length = 0
        for(let i = 0; i < this.layout.lengths.length; i++){
            this.length += this.layout.lengths[i];
        }

        this.updatables.forEach(element => {
            element.update(deltaT);
        });
    }

    drawSectors(ctx){
        if(!this.showApexes) return;

        for(let i = 0; i < this.sectors.length; i++){
            if(this.sectors[i].pos > this.layout.totalLength && this.layout.loaded){
                this.sectors[i].pos = this.layout.totalLength;
            }
            let pos = this.layout.getParameterizedPos(this.sectors[i].pos);

            let color = "#ddd";
            if(i == this.findPointIndex(this.selectedPoint, pointTypes.Sector) && this.selectedPointType == pointTypes.Sector)
                color = "#aaa";

            DrawCircle(ctx, pos, color, 5);
            DrawText(ctx, {x: pos.x, y: pos.y - 10}, "#000", 20, "Sector " + (i + 1));
        }
    }

    drawSectorPositions(ctx){
        for(let i = 0; i < this.sectors.length; i++){
            let text = this.sectors[i].pos;
            DrawText(ctx, {x: 1300, y: 100 + (i + this.apexes.length) * 30}, "#000", 24, text);
        }
    }

    drawCornerLengths(ctx){
        for(let i = 0; i < this.apexes.length; i++){
            let length = this.apexes[i].exit.pos - this.apexes[i].entry.pos;
            let text = "";
            text = text + (i+1) + ": " + length;
            let curvature = Math.abs(1 /this.layout.getCurvature(this.layout.getParameterizedT(this.apexes[i].apex.pos)))
            text = text + " " + Math.round((curvature + Number.EPSILON) * 100) / 100;
            text = text + " " + Math.round((this.calculateMinSpeed(curvature) + Number.EPSILON) * 100) / 100;

            DrawText(ctx, {x: 1300, y: 100 + i * 30}, "#000", 24, text);
        }
    }

    dragSplinePoint(pos, root){
        root.controlPoints.forEach(element => {
            element.splines.forEach(element => {
                this.dragSplinePoint(pos, element);
            });

            root.dragPoint(pos);
            if(root.selectedPoint != -1)
            {
                this.inputHandler.spline = root;
                this.inputHandler.pointManager = root.pointManager;
            }
        });
    }
    
    toggleSplineLock(root){
        root.controlPoints.forEach(element => {
            element.splines.forEach(element => {
                this.toggleSplineLock(element);
            });
        });

        root.toggleSplineLock();
    }

    changeSplineThickness(root, thickness){
        root.controlPoints.forEach(element => {
            element.splines.forEach(element => {
                this.changeSplineThickness(element, thickness);
            });
        });

        root.SPLINE_THICKNESS = thickness;
    }

    cullSplines(root){
        root.controlPoints.forEach(element1 => {
            element1.splines.forEach(element2 => {
                this.cullSplines(element2);
                if(element2.controlPoints.length < 4)
                    element1.splines.splice(element1.splines.indexOf(element2), 1);
            });
        });
    }

    getSplineToJoin(root, pos, alreadyFound){
        root.controlPoints.forEach(element1 => {
            if(root.findPoint(pos) > 0)
            {
                alreadyFound = root;
                return alreadyFound;   
            }
            element1.splines.forEach(element2 => {
                if(element2.findPoint(pos) > 0){
                    alreadyFound = element2
                    return alreadyFound;
                }
                alreadyFound = this.getSplineToJoin(element2, pos, alreadyFound);
            });
        });

        return alreadyFound;
    }

    getPointsToJoin(pos){
        let spline = this.getSplineToJoin(this.layout, pos, null);
        if(spline == null){
            console.error("Didn't find spline")
            return null;
        }

        let index = spline.findPoint(pos);
        if(index < 0)
        {
            return null;
        }
        return [spline.controlPoints[index], spline.controlPoints[index + 1]]
    }

    toggleShowTrace(){
        this.showTrace = !this.showTrace;
    }

    //Pls fix
    loadLayout(path){
        if(path == null) return;

        this.layout.loaded = false;

        fetch(path)
        .then(response => {
            return response.json();
         })
        .then(jsondata => {
            this.layout.controlPoints = jsondata.spline;
            
            this.layout.loaded = true;
            this.layout.locked = true;
            this.layout.ended = true;

            //merge end points
            this.layout.controlPoints[this.layout.controlPoints.length - 3] = this.layout.controlPoints[0];
            this.layout.controlPoints[this.layout.controlPoints.length - 2] = this.layout.controlPoints[1];
            this.layout.controlPoints[this.layout.controlPoints.length - 1] = this.layout.controlPoints[2];

            document.getElementById("trackName").value = jsondata.name;
            this.apexes = jsondata.apexes;
            this.sectors = jsondata.sectors;
            document.getElementById("trackLength").value = jsondata.trackLength;
            document.getElementById("trackTemp").value = jsondata.trackTemp;
            document.getElementById("trackDeg").value = jsondata.trackDeg;
            document.getElementById("pitDelta").value = jsondata.pitDelta;
            document.getElementById("slipstream").value = jsondata.slipstream;
            document.getElementById("speedLimit").value = jsondata.speedLimit;

            this.layout.loaded = true;
        })
        .catch((error) => console.error("Track file not found."));
    }

    saveImage(){
        let zoom = 4;

        let trackLength = document.getElementById("trackLength").value;
        let trackName = document.getElementById("trackName").value;
        let lengthRatio = trackLength / this.layout.totalLength;
        let originalThickness = this.layout.SPLINE_THICKNESS;

        this.changeSplineThickness(this.layout, zoom * 50);
        this.scaleLayout(lengthRatio * zoom, this.layout);
        this.setScaled(false, this.layout);

        let newCanvas = document.createElement("canvas");
        newCanvas.width = 10000;
        newCanvas.height = 10000;
        let newCtx = newCanvas.getContext("2d");

        this.layout.draw(newCtx);

        
        let data = newCanvas.toDataURL("image/png");

        const a = document.createElement("a");
        let fileName = trackName + ".png";
        a.href = data;
        a.setAttribute("download", fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);


        
        this.changeSplineThickness(this.layout, originalThickness);
        this.scaleLayout(1 / (lengthRatio * zoom), this.layout);
        this.setScaled(false, this.layout);

    }

    scaleLayout(scale, root){
        root.controlPoints.forEach(element1 => {
            element1.splines.forEach(element2 => {
                this.scaleLayout(scale, element2);
            });
        });

        root.scalePoints(scale);
    }

    setScaled(scaled, root){
        root.controlPoints.forEach(element1 => {
            element1.splines.forEach(element2 => {
                this.setScaled(scaled, element2);
            });
        });

        root.setScaled(scaled);
    }

    saveTrack(){
        if(!this.layout.ended){
            this.textDisplayHandler.displayText(1000, "End spline to save", "#f00", {x: 800, y: 600});
            return;
        }

        let trackName = document.getElementById("trackName").value;
        let trackLength = document.getElementById("trackLength").value;
        let trackTemp = document.getElementById("trackTemp").value;
        let trackDeg = document.getElementById("trackDeg").value;
        let pitDelta = document.getElementById("pitDelta").value;
        let speedLimit = document.getElementById("speedLimit").value;
        let slipstream = document.getElementById("slipstream").value;
        let minSpeeds = [];

        //Save minSpeeds
        for(let i = 0; i < this.apexes.length; i++){
            let curvature = Math.abs(1 / this.layout.getCurvature(this.layout.getParameterizedT(this.apexes[i].apex.pos)));

            minSpeeds.push(Math.round(this.calculateMinSpeed(curvature)));
        }

        //Check that all entries come before apexes and exits
        for(let i = 0; i < this.apexes.length; i++){
            if(this.apexes[i].entry.pos > this.apexes[i].apex.pos ||this.apexes[i].entry.pos > this.apexes[i].exit.pos){
                //Display some sort of error pls :(
                return;
            }
            if(this.apexes[i].exit.pos < this.apexes[i].apex.pos)
            {
                //Display some sort of error pls :(
                return;   
            }
        }
        let trackToSave = {
            name: trackName,
            spline: this.layout.controlPoints,
            apexes: this.apexes,
            minSpeeds: minSpeeds,
            sectors: this.sectors,
            trackLength: trackLength,
            trackTemp: trackTemp,
            trackDeg: trackDeg,
            pitDelta: pitDelta,
            speedLimit: speedLimit,
            slipstream, slipstream,
        };
        let fileName = trackName + ".json";
        
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(trackToSave, null, 2)], {
          type: "text/plain"
        }));
        a.setAttribute("download", fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    calculateMinSpeed(curvature){
        const MAX_CORNER_RADIUS = 90;
        const MIN_CORNER_RADIUS = 4;
        const CORNER_RADIUS_DELTA = MAX_CORNER_RADIUS - MIN_CORNER_RADIUS;

        if(curvature > MAX_CORNER_RADIUS)
            return MAX_SPEED;
        if(curvature < MIN_CORNER_RADIUS)
            return MIN_SPEED;
        
        return (((MAX_CORNER_RADIUS - curvature) / CORNER_RADIUS_DELTA) * MIN_SPEED + ((curvature - MIN_CORNER_RADIUS) / CORNER_RADIUS_DELTA) * MAX_CORNER_SPEED);

    }
}
