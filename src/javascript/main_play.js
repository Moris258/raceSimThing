import { Camera } from "./camera.js";
import Driver from "./driver.js";
import Series from "./series.js";
import RaceEventLog, { EventTypes, RacePublisher } from "./raceEvent.js";
import { NonEditableSpline } from "./spline.js";
import Team from "./team.js";
import Track, { cornerTypes } from "./trackPlay.js";

let canvas = document.getElementById("mainScreen");
let ctx = canvas.getContext("2d");

export const GAME_WIDTH = canvas.clientWidth;
export const GAME_HEIGHT = canvas.clientHeight;

let track = new Track(GAME_WIDTH, GAME_HEIGHT, new NonEditableSpline(GAME_WIDTH, GAME_HEIGHT, "./tracks/Jeddah.png"));

await track.loadLayout("./tracks/Jeddah.json");

let drivers = [];
let teams = [];
await setupDriversTeams();

/*
let drivers = [new Driver("#0ff", track, "LH", [94, 93, 94, 0, 92, 94, 97, 0, 92, 94, 95, 36, 97]),
                new Driver("#00f", track, "MV", [94, 95, 94, 0, 90, 80, 95, 0, 95, 90, 94, 24, 97])];
let teams = [new Team("Mercedes", "#0ff"), new Team("Red Bull", "#00f")];
drivers[0].setTeam(teams[0]);
teams[0].addDriver(drivers[0]);*/


//drivers[1].setTeam(teams[1]);

let slider = document.getElementById("gameSpeedSlider");

/*
let raceEndedPublisher = new RacePublisher(EventTypes.raceEnd);
let weekendEndedPublisher = new RacePublisher(EventTypes.weekendEnd);
let raceLog = new RaceEventLog();
raceEndedPublisher.subscribe(raceLog);
weekendEndedPublisher.subscribe(raceLog);

raceEndedPublisher.publish({text: "lol"});
weekendEndedPublisher.publish();*/


/*
for(let i = 0; i < 10; i++){
    let newDriver = new Driver("#00" + i, track, "lol", null);
    newDriver.speed = 50 + i * 10;
    drivers.push(newDriver)
}*/

let camera = new Camera();
camera.setCameraPos({x: -300, y: -100});

let series = new Series(GAME_WIDTH, GAME_HEIGHT, "F1");
series.setTrack(track);
series.setDrivers(drivers);
series.setTeams(teams);


series.initializeDrivers();
series.learnBraking();

slider.oninput = function() {
    series.GAME_SPEED = this.value;
}



let lastT = 0;
function mainLoop(timeStamp){

    let deltaT = timeStamp - lastT;
    lastT = timeStamp;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    series.update(deltaT * series.GAME_SPEED);
    series.draw(ctx, camera);
    requestAnimationFrame(mainLoop);
}

async function setupDriversTeams(){
    drivers = [ new Driver("#00f", track, "LH", [94, 93, 94, 0, 92, 94, 97, 0, 92, 94, 95, 36, 97]),
                new Driver("#00f", track, "GR", [87, 89, 90, 0, 93, 70, 95, 0, 88, 90, 80, 24, 94]),
                new Driver("#00f", track, "MV", [94, 95, 94, 0, 90, 80, 95, 0, 95, 90, 94, 24, 97]),
                new Driver("#00f", track, "SP", [89, 87, 90, 0, 82, 90, 99, 0, 89, 92, 89, 32, 90]),
                new Driver("#00f", track, "CL", [90, 91, 92, 0, 80, 75, 91, 0, 92, 82, 80, 24, 94]),
                new Driver("#00f", track, "CS", [88, 87, 89, 0, 89, 80, 93, 0, 85, 89, 89, 27, 90]),
                new Driver("#00f", track, "FA", [88, 95, 88, 0, 85, 99, 92, 0, 87, 87, 87, 41, 95]),
                new Driver("#00f", track, "EO", [85, 83, 88, 0, 82, 70, 92, 0, 84, 80, 84, 26, 88]),
                new Driver("#00f", track, "LN", [87, 90, 89, 0, 83, 70, 90, 0, 86, 88, 84, 23, 94]),
                new Driver("#00f", track, "DR", [84, 83, 86, 0, 83, 92, 92, 0, 90, 86, 81, 33, 91]),

                new Driver("#00f", track, "PG", [87, 90, 82, 0, 88, 72, 93, 0, 96, 84, 87, 25, 93]),
                new Driver("#00f", track, "YT", [83, 81, 91, 0, 70, 62, 89, 0, 92, 81, 78, 21, 95]),
                new Driver("#00f", track, "SV", [89, 92, 85, 0, 90, 99, 93, 0, 86, 93, 86, 35, 96]),
                new Driver("#00f", track, "LS", [82, 88, 87, 0, 83, 80, 92, 0, 89, 87, 90, 25, 89]),
                new Driver("#00f", track, "VB", [91, 92, 84, 0, 86, 87, 91, 0, 80, 75, 75, 33, 92]),
                new Driver("#00f", track, "GZ", [81, 83, 80, 0, 91, 56, 89, 0, 87, 90, 88, 23, 90]),
                new Driver("#00f", track, "KM", [87, 88, 89, 0, 85, 89, 95, 0, 93, 83, 86, 30, 90]),
                new Driver("#00f", track, "MS", [85, 86, 84, 0, 75, 65, 90, 0, 90, 90, 84, 23, 93]),
                new Driver("#00f", track, "AA", [88, 80, 95, 0, 95, 75, 93, 0, 90, 86, 89, 24, 91]),
new Driver("#00f", track, "NL", [75, 76, 80, 0, 85, 70, 86, 0, 85, 84, 76, 27, 85])];

    teams = [   new Team("Mercedes", "#0ff"),
                new Team("Red Bull", "#00f"),
                new Team("Ferrari", "#d90404"),
                new Team("Alpine", "#00c8ff"),
                new Team("McLaren", "#ffae00"),
                new Team("Alpha Tauri", "#303947"),
                new Team("Aston Martin", "#05733f"),
                new Team("Alfa Romeo", "#6e0110"),
                new Team("Haas", "#8c8b8b"),
new Team("Williams", "#027bb3")];

    await teams[0].loadTeam("./teams/Mercedes.json");
    await teams[1].loadTeam("./teams/Red Bull.json");
    await teams[2].loadTeam("./teams/Ferrari.json");
    await teams[3].loadTeam("./teams/Alpine.json");
    await teams[4].loadTeam("./teams/McLaren.json");
    await teams[5].loadTeam("./teams/Alpha Tauri.json");
    await teams[6].loadTeam("./teams/Aston Martin.json");
    await teams[7].loadTeam("./teams/Alfa Romeo.json");
    await teams[8].loadTeam("./teams/Haas.json");
    await teams[9].loadTeam("./teams/Williams.json");
    teams.forEach(element => {
        console.log(element.carBlueprint.gearbox.gearRange);
    });
    

    for(let i = 0; i < drivers.length; i++){
        let teamIndex = Math.floor(i / 2);
        drivers[i].setTeam(teams[teamIndex]);
        teams[teamIndex].addDriver(drivers[i]);
    }

}

mainLoop(0);



