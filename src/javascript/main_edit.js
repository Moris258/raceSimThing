import Track from "./track.js";
import InputHandler from "./inputHandler.js";
import { EditableSpline } from "./spline.js";
import { Camera } from "./camera.js";

let canvas = document.getElementById("mainScreen");
let ctx = canvas.getContext("2d");

const GAME_WIDTH = canvas.clientWidth;
const GAME_HEIGHT = canvas.clientHeight;

let trackImg = new Image();
let tracksPath = "./tracks/";
let track = new Track(GAME_WIDTH, GAME_HEIGHT, new EditableSpline(GAME_WIDTH, GAME_HEIGHT, false), trackImg);
let camera = new Camera();
let lastT = 0;

let slider = document.getElementById("gameSpeedSlider");
let loadTraceFile = document.getElementById("loadTrace");
let loadTrackButton = document.getElementById("loadTrackButton");
let trackNameField = document.getElementById("trackName");
let splineColorPicker = document.getElementById("splineColor");


splineColorPicker.onchange = function(event){
    track.inputHandler.spline.changeColor(event.target.value);
}

loadTrackButton.onclick = function(){
    let trackPath = tracksPath + trackNameField.value + ".json";
    track.loadLayout(trackPath);
}


loadTraceFile.onchange = function (event) {
    trackImg.src = URL.createObjectURL(event.target.files[0]);
}

slider.oninput = function() {
    track.changeSplineThickness(track.layout, slider.value);
}

let trackFile = null;
function mainLoop(timeStamp){


    let deltaT = timeStamp - lastT;
    lastT = timeStamp;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    track.update(deltaT);
    track.draw(ctx, camera);

    requestAnimationFrame(mainLoop);
}

mainLoop(0);