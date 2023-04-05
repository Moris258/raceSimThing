import { PointManager } from "./track.js";
import { DrawCircle, drawLine } from "./utility.js";

export default class Spline{
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT) {
        this.controlPoints = [];
        this.lengths = [];
        this.individualLengths = [];
        this.totalLength = 0;
        this.NUMBER_OF_SUB_SEGMENTS = 20;
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;

        /*
        for(let i = 0;i < this.layout.length; i++)
            this.addControlPoint(this.layout[i]);*/
    }

    getLengths(points){
        let step = 1 / this.NUMBER_OF_SUB_SEGMENTS;
        let t = 0;
        let newLengths = [];
        let totalLength = 0;

        while(t < 1){
            let step2 = Math.min(step, 1 - t);

            let p1 = this.getPos(t, points);
            let p2 = this.getPos(t + step2, points);
            let length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            newLengths.push(length);
            totalLength += length;
            t += step;
        }

        this.individualLengths.push(newLengths);
        this.lengths.push(totalLength);
        this.totalLength += totalLength;
    }

    getCurvature(t){
        let spline = Math.floor(t);

        let points = [this.controlPoints[spline], this.controlPoints[spline + 1], this.controlPoints[spline + 2], this.controlPoints[spline + 3]];

        let vel = this.getVelocity(t - spline, points);
        let acc = this.getAcceleration(t - spline, points);
        if(!vel || !acc)
            return null;

        return ((vel.x * acc.y - acc.x * vel.y) / Math.pow(vel.x * vel.x + vel.y * vel.y, 3/2));
    }

    getVelocity(t, points){
        if(points.length < 4)
            return null;

        let p1 = points[0].pos;
        let p2 = points[1].pos;
        let p3 = points[2].pos;
        let p4 = points[3].pos;
        let s = 0.5;

        return {
            x: (s * (-3 * t * t + 4 * t - 1)) * p1.x
                + (s * (9 * t * t - 10 * t)) * p2.x 
                + (s * (-9 * t * t + 8 * t + 1)) * p3.x
                + (s * (3 * t * t - 2 * t)) * p4.x,
            y: (s * (-3 * t * t + 4 * t - 1)) * p1.y
                + (s * (9 * t * t - 10 * t)) * p2.y 
                + (s * (-9 * t * t + 8 * t + 1)) * p3.y
                + (s * (3 * t * t - 2 * t)) * p4.y,
        };
    }

    getAcceleration(t, points){
        if(points.length < 4)
            return null;

        let p1 = points[0].pos;
        let p2 = points[1].pos;
        let p3 = points[2].pos;
        let p4 = points[3].pos;
        let s = 0.5;

        return {
            x: (s * (-6 * t + 4)) * p1.x
                + (s * (18 * t - 10)) * p2.x 
                + (s * (-18 * t + 8)) * p3.x
                + (s * (6 * t - 2)) * p4.x,
            y: (s * (-6 * t + 4)) * p1.y
                + (s * (18 * t - 10)) * p2.y 
                + (s * (-18 * t + 8)) * p3.y
                + (s * (6 * t - 2)) * p4.y,
        };
    }

    

    getPos(t, points){
        if(points.length < 4)
            return;

        let p1 = points[0].pos;
        let p2 = points[1].pos;
        let p3 = points[2].pos;
        let p4 = points[3].pos;
        let s = 0.5;

        return {
            x: (-s * t + 2 * s * t * t - s * t * t * t) * p1.x
                + (1  + t * t *(s - 3) + t * t * t * (2 - s)) * p2.x 
                + (s * t + t * t * (3 - 2 * s) + t * t * t * (s - 2)) * p3.x
                + (-t * t * s + t * t * t * s) * p4.x,
            y: (-s * t + 2 * s * t * t - s * t * t * t) * p1.y
                + (1  + t * t *(s - 3) + t * t * t * (2 - s)) * p2.y
                + (s * t + t * t * (3 - 2 * s) + t * t * t * (s - 2)) * p3.y
                + (-t * t * s + t * t * t * s) * p4.y,
        };
    }

    //Returns x, y position based on parameter T of spline
    getSplinePos(T){
        let spline = Math.floor(T);

        let points = [this.controlPoints[spline], this.controlPoints[spline + 1], this.controlPoints[spline + 2], this.controlPoints[spline + 3]];
        return this.getPos(T - spline, points);
    }

    //Returns x, y position based on position in spline (parameterized)
    getParameterizedPos(pos){
        if(!this.loaded) return {
            x: 0,
            y: 0,
        };

        
        if((!pos && pos != 0) ||  pos < 0){
            console.error("Position is invalid");
            return {
                x: 0,
                y: 0,
            };
        }

        if(pos > this.totalLength)
            return {
                x: 0,
                y: 0,
            };

        return this.getSplinePos(this.getParameterizedT(pos));
    }

    //Returns T based on position in spline (parameterized)
    getParameterizedT(Pos){
        if(!this.loaded) return 0;

        let sumLength = this.lengths[0];
        let index = 0;
        let indexIndividual = 0;
        let finalT = 0;

        //find correct spline segment
        while(sumLength < Pos && index < this.lengths.length - 1){
            index++;
            sumLength += this.lengths[index];
        }

        sumLength -= this.lengths[index];
        let foundLengths = this.individualLengths[index];
        sumLength += foundLengths[0];
        finalT = index;

        //find correct sub-segment in spline segment
        while(sumLength < Pos && indexIndividual < this.NUMBER_OF_SUB_SEGMENTS - 1)
        {
            indexIndividual++;
            sumLength += foundLengths[indexIndividual];
        }
        
        let sumLengthEnd = sumLength;
        sumLength -= foundLengths[indexIndividual];
        finalT += indexIndividual / this.NUMBER_OF_SUB_SEGMENTS;
        let sumDiff = sumLengthEnd - sumLength;
        let PosDiff = Pos - sumLength;

        //interpolate between sub-segments
        finalT += (1 / this.NUMBER_OF_SUB_SEGMENTS) * (PosDiff / sumDiff);
        if(finalT >= this.lengths.length)
            finalT -= this.lengths.length;
        if(!finalT)
            return 0;

        return finalT;
    }

    setLengths(){
        if(this.controlPoints.length < 4)
            return;

        let curves = this.controlPoints.length - 3;
        this.lengths = [];
        this.individualLengths = [];
        this.totalLength = 0;

        for(let i = 0; i < curves; i++){
            let points = [this.controlPoints[i], this.controlPoints[i + 1], this.controlPoints[i + 2], this.controlPoints[i + 3]];
            this.getLengths(points, i);
        }
    }

    

}

export class EditableSpline extends Spline{
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT, isChild){
        super(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.draggedPoint = -1;
        this.ended = false;
        this.locked = false;
        this.loaded = true;
        this.baseColor = "#000"
        this.color = "#000";
        this.SPLINE_THICKNESS = 5;
        this.selectedPoint = -1;
        this.isChild = isChild;
        this.canJoin = false;
        this.pointManager = new PointManager(this);
    }

    changeColor(color){
        this.baseColor = color;
        if(this.selectedPoint == -1)
            this.color = color;
    }

    draw(ctx, camera){
        if(this.controlPoints.length < 4)
            return;

        let curves = this.controlPoints.length - 3;

        this.lengths = [];
        this.individualLengths = [];
        this.totalLength = 0;         

        for(let i = 0; i < curves; i++){
            let points = [this.controlPoints[i], this.controlPoints[i + 1], this.controlPoints[i + 2], this.controlPoints[i + 3]];
            points[0].splines.forEach(element => {
                element.draw(ctx);
            });
            this.drawSpline(ctx, points);
            this.getLengths(points, i);
        }
        for(let i = curves; i < curves + 3; i++)
            this.controlPoints[i].splines.forEach(element => {
                element.draw(ctx);
            });
        
        this.drawControlPoints(ctx);
        this.pointManager.draw(ctx);
    }

    drawControlPoints(ctx){
        if(!this.locked){
            for(let i = 1; i < this.controlPoints.length - 1; i++)
            {
                let point = this.controlPoints[i];
                let color = "#f00";
                if(i == this.selectedPoint)
                    color = "#00f";

                DrawCircle(ctx, point.pos, color, 5);
            }
        }
    }

    drawSpline(ctx, points){
        let step = 0.05 / (this.SPLINE_THICKNESS);
        let t = 0;

        while(t < 1){
            let p1 = this.getPos(t, points);
            let p2 = this.getPos(t + step + 0.01, points);
            drawLine(ctx, p1, p2, this.color, this.SPLINE_THICKNESS);
            t += step;
        }
    }

    

    drawSplineRange(ctx, start, end, color){
        let startT = this.getParameterizedT(start);
        let endT = this.getParameterizedT(end);

        if(startT > endT)
            return;

        let currentT = startT;

        let step = 0.01;
        while(currentT < endT){
            let spline = Math.floor(currentT);
            let step2 = Math.min(step, endT - currentT);

            let points = [this.controlPoints[spline], this.controlPoints[spline + 1], this.controlPoints[spline + 2], this.controlPoints[spline + 3]];

            let p1 = this.getPos(currentT - spline, points);
            let p2 = this.getPos(currentT - spline + step2 + 0.01, points);
            drawLine(ctx, p1, p2, color, this.SPLINE_THICKNESS);

            currentT += step;
        }
    }

    addSpline(){
        if(this.locked || this.selectedPoint <= 0) return;
        let newSpline = new EditableSpline(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, true);

        newSpline.addControlPoint(null);
        newSpline.addControlPoint(null);
        newSpline.controlPoints[1].pos = this.controlPoints[this.selectedPoint].pos;
        newSpline.controlPoints[0].pos = this.controlPoints[this.selectedPoint - 1].pos;

        this.controlPoints[this.selectedPoint].splines.push(newSpline);
    }

    addControlPoint(pos){
        if(this.locked) return;

        if(this.controlPoints.length == 0 && !this.ended)
        {
            pos = {
                x: 100,
                y: 100,
            };
            this.controlPoints[0] = new ControlPoint(pos);
            return;
        }

        if(this.selectedPoint > 0 && this.selectedPoint < this.controlPoints.length - 2 && pos == null){
            let pos = this.getSplinePos(this.selectedPoint - 0.5);

            this.controlPoints.splice(this.selectedPoint + 1, 0, new ControlPoint(pos));
            return;
        }

        if(this.ended) return;

        if(this.controlPoints.length == 1){
            pos = {
                x: 200,
                y: 200,
            };
            this.controlPoints[2] = new ControlPoint(pos);
            this.controlPoints[1] = this.controlPoints[0];
            let dir = {
                x: this.controlPoints[2].pos.x - this.controlPoints[1].pos.x,
                y: this.controlPoints[2].pos.y - this.controlPoints[1].pos.y,
            };

            this.controlPoints[0] = new ControlPoint({
                x: this.controlPoints[1].pos.x - dir.x,
                y: this.controlPoints[1].pos.y - dir.y,
            });
        }
        else{

            if(pos == null)
                pos = {
                x: this.controlPoints[this.controlPoints.length - 1].pos.x,
                y: this.controlPoints[this.controlPoints.length - 1].pos.y,
            };

            if(pos.x < 0) pos.x = 0;
            if(pos.y < 0) pos.y = 0;
            if(pos.x > this.SCREEN_WIDTH) pos.x = this.SCREEN_WIDTH;
            if(pos.y > this.SCREEN_HEIGHT) pos.y = this.SCREEN_HEIGHT;


            this.controlPoints[this.controlPoints.length - 1] = new ControlPoint(pos);
        }

        let lastPoint = this.controlPoints[this.controlPoints.length - 2];
        let newPoint = this.controlPoints[this.controlPoints.length - 1];


        let dir = {
            x: newPoint.pos.x - lastPoint.pos.x,
            y: newPoint.pos.y - lastPoint.pos.y,
        };

        this.controlPoints[this.controlPoints.length] = new ControlPoint({
            x: newPoint.pos.x + dir.x,
            y: newPoint.pos.y + dir.y,
        });

    }

    removeControlPoint(){
        if((this.controlPoints.length < 5 && !this.isChild) || this.locked) return;

        if(this.selectedPoint > 1 && this.selectedPoint < this.controlPoints.length - 3){
            this.controlPoints.splice(this.selectedPoint, 1);
            this.selectedPoint = -1;
            return;
        }

        if(this.ended) return;

        this.controlPoints.pop();
        this.controlPoints.pop();
        let lastPoint = this.controlPoints[this.controlPoints.length - 2];
        let newPoint = this.controlPoints[this.controlPoints.length - 1];


        let dir = {
            x: newPoint.pos.x - lastPoint.pos.x,
            y: newPoint.pos.y - lastPoint.pos.y,
        };

        this.controlPoints[this.controlPoints.length] = new ControlPoint({
            x: newPoint.pos.x + dir.x,
            y: newPoint.pos.y + dir.y,
        });
        this.setLengths();
        this.selectedPoint = -1;
        
    }

    toggleJoinSpline(points){
        if(this.locked) return;
        if(points == null)  return;
        if(points.length < 2) return;
        if(!this.isChild) return;

        

        this.controlPoints[this.controlPoints.length - 1].pos = points[0].pos;
        this.controlPoints[this.controlPoints.length] = new ControlPoint();
        this.controlPoints[this.controlPoints.length - 1].pos = points[1].pos;
        this.ended = true;
        this.canJoin = false;
    }

    setCanJoin(){
        if(!this.isChild) return;

        if(this.ended){
            this.controlPoints.pop();
            this.controlPoints.pop();

            let lastPoint = this.controlPoints[this.controlPoints.length - 2];
            let newPoint = this.controlPoints[this.controlPoints.length - 1];


            let dir = {
                x: newPoint.pos.x - lastPoint.pos.x,
                y: newPoint.pos.y - lastPoint.pos.y,
            };

            this.controlPoints[this.controlPoints.length] = new ControlPoint({
                x: newPoint.pos.x + dir.x,
                y: newPoint.pos.y + dir.y,
            });
            this.ended = false;

            return;
        }

        this.canJoin = !this.canJoin;
    }

    toggleEndSpline(){
        if(this.locked) return;

        if(this.ended){

            this.controlPoints.pop();
            this.controlPoints.pop();
            this.controlPoints.pop();

            let lastPoint = this.controlPoints[this.controlPoints.length - 2];
            let newPoint = this.controlPoints[this.controlPoints.length - 1];


            let dir = {
                x: newPoint.pos.x - lastPoint.pos.x,
                y: newPoint.pos.y - lastPoint.pos.y,
            };

            this.controlPoints[this.controlPoints.length] = new ControlPoint({
                x: newPoint.pos.x + dir.x,
                y: newPoint.pos.y + dir.y,
            });
            
            dir = {
                x: this.controlPoints[2].pos.x - this.controlPoints[1].pos.x,
                y: this.controlPoints[2].pos.y - this.controlPoints[1].pos.y,
            };


            this.controlPoints[0] = new ControlPoint({
                x: this.controlPoints[1].pos.x - dir.x,
                y: this.controlPoints[1].pos.y - dir.y,
            });

            this.ended = false;
            return;
        }
        if(this.controlPoints.length <= 1)
            return;
        this.controlPoints[this.controlPoints.length - 1].pos = this.controlPoints[0].pos;
        this.controlPoints[this.controlPoints.length] = new ControlPoint({x: 0, y: 0});
        this.controlPoints[this.controlPoints.length - 1].pos = this.controlPoints[1].pos;
        
        this.controlPoints[this.controlPoints.length] = new ControlPoint({x: 0, y: 0});
        this.controlPoints[this.controlPoints.length - 1].pos = this.controlPoints[2].pos;
        this.ended = true;
    }

    toggleSplineLock(){
        this.locked = !this.locked;
    }
    dragPoint(pos){
        if(this.locked) return;
        this.draggedPoint = this.findPoint(pos);
        this.selectedPoint = this.draggedPoint;
        if(this.selectedPoint > -1)
            this.color = "#f00";
        else
            this.color = this.baseColor;
    }

    resetDraggedPoint(){
        this.draggedPoint = -1;
    }

    findPoint(pos){
        for(let i = 1; i < this.controlPoints.length - 1; i++){
            let point = this.controlPoints[i];
            if(pos.x >= point.pos.x - 10 && pos.x <= point.pos.x + 10){
                if(pos.y >= point.pos.y - 10 && pos.y <= point.pos.y + 10){
                    return i;
                }
            }
        }

        return -1;
    }

    movePoint(pos){
        if(this.draggedPoint == -1 || this.locked) return;

        this.controlPoints[this.draggedPoint].pos.x = pos.x;
        this.controlPoints[this.draggedPoint].pos.y = pos.y;

        if(this.draggedPoint < 3 && !this.ended && !this.isChild){
            let dir = {
                x: this.controlPoints[2].pos.x - this.controlPoints[1].pos.x,
                y: this.controlPoints[2].pos.y - this.controlPoints[1].pos.y,
            };
            this.controlPoints[0] = new ControlPoint({
                x: this.controlPoints[1].pos.x - dir.x,
                y: this.controlPoints[1].pos.y - dir.y,
            });
        }
        if(this.draggedPoint >= this.controlPoints.length - 3 && !this.ended){
            let lastPoint = this.controlPoints[this.controlPoints.length - 3];
            let newPoint = this.controlPoints[this.controlPoints.length - 2];
    
    
            let dir = {
                x: newPoint.pos.x - lastPoint.pos.x,
                y: newPoint.pos.y - lastPoint.pos.y,
            };
    
            this.controlPoints[this.controlPoints.length - 1] = new ControlPoint({
                x: newPoint.pos.x + dir.x,
                y: newPoint.pos.y + dir.y,
            });
        }
    }

    scalePoints(scale){
        this.controlPoints.forEach(element => {
            if(!element.pos.scaled){
                element.pos.x *= scale;
                element.pos.y *= scale;
                element.pos.scaled = true;
            }
        });
    }

    setScaled(scaled){
        this.controlPoints.forEach(element => {
            element.pos.scaled = scaled;            
        });
    }
}

export class NonEditableSpline extends Spline{
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT, imgPath){
        super(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.img = new Image();
        this.img.src = imgPath;
        this.loaded = false;
    }

    draw(ctx, camera){
        ctx.drawImage(this.img, 0 - camera.pos.x, 0 - camera.pos.y);
    }
}

class ControlPoint{
    constructor(pos = {x: 0,y: 0}) {
        this.pos = {
            x: pos.x,
            y: pos.y,
            scaled: false
        };
        this.splines = [];
    }
}