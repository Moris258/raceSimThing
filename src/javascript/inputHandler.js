import { pointTypes } from "./track.js";

export default class InputHandler{
    constructor(spline, track) {
        //Maybe change this to array and do it for every item in array?
        this.spline = spline;
        this.track = track;
        this.pointManager = spline.pointManager;


        document.addEventListener("mousedown", event => {
            let pos = {
                x: event.clientX - 10,
                y: event.clientY - 10,
            };
            //this.spline.dragPoint(pos);
            if(this.spline.canJoin)
                this.spline.toggleJoinSpline(this.track.getPointsToJoin(pos));
            else{
                this.track.dragSplinePoint(pos, this.track.layout);
                this.pointManager.dragPoint(pos);
            }
        });

        document.addEventListener("mouseup", event => {
            this.spline.resetDraggedPoint();
            this.pointManager.resetDraggedPoint();
        });

        document.addEventListener("mousemove", event => {
            let pos = {
                x: event.clientX - 10,
                y: event.clientY - 10,
            };
            this.spline.movePoint(pos);
            this.pointManager.movePoint(pos);
        });

        document.addEventListener("keypress", event => {
            switch(event.code){
                case "KeyE":
                    this.spline.addControlPoint(null);
                    break;
                case "KeyS":
                    if(!this.spline.isChild)
                        this.spline.toggleEndSpline();
                    else
                        this.spline.setCanJoin();
                    break;
                case "KeyR":
                    this.spline.removeControlPoint();
                    this.track.cullSplines(this.track.layout);
                    this.pointManager.shiftApexes();
                    this.pointManager.removePoint();
                    break;
                case "Backquote":
                    if(!this.track.layout.locked){
                        this.track.toggleSplineLock(this.track.layout);
                        if(this.pointManager.locked)
                            this.pointManager.toggleTrackLock();
                    }
                    else if(this.track.layout.locked && !this.pointManager.locked)
                        this.pointManager.toggleTrackLock();
                    else
                        this.track.toggleSplineLock(this.track.layout);
                    break;
                case "KeyQ":
                    this.track.saveTrack();
                    break;
                case "KeyA":
                    this.pointManager.addPoint(pointTypes.Apex)
                    break;
                case "KeyZ":
                    this.pointManager.addPoint(pointTypes.Sector)
                    break;
                case "KeyH":
                    this.pointManager.toggleShowApexes();
                    break;
                case "KeyT":
                    this.track.toggleShowTrace();
                    break;
                case "KeyX":
                    this.spline.addSpline();
                    break;
                case "KeyP":
                    this.track.saveImage();
                    break;
            }            
        })
    }
}