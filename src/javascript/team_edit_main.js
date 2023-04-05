import { DownloadFile, carTypes, statTypes } from "./utility.js";


let saveTeamButton = document.getElementById("saveTeamButton");
saveTeamButton.onclick = saveTeam;

let selectedCar = null;
let carStatsDiv = document.getElementById("carStatsDiv");

let carTypeRadioGroup = document.getElementsByName("carType");
carTypeRadioGroup.forEach(element => {
    element.onclick = carTypeChanged;
});

let carBalanceSlider = document.getElementById("carBalance");
carBalanceSlider.oninput = function(){
    document.getElementById("carBalanceValue").innerHTML = this.value;
};

function saveTeam(){
    if(!selectedCar) return;
    let newTeam = {};

    newTeam["teamName"] = document.getElementById("teamName").value;
    newTeam["teamType"] = selectedCar;
    newTeam["teamColor"] = document.getElementById("teamColor").value;
    newTeam["engine"] = {};
    newTeam["engine"]["performance"] = document.getElementById("enginePerformance").value;
    newTeam["engine"]["efficiency"] = document.getElementById("engineFuelEff").value;
    newTeam["engine"]["reliability"] = document.getElementById("engineReliability").value;
    newTeam["brakes"] = {};
    newTeam["brakes"]["performance"] = document.getElementById("teamBraking").value;
    newTeam["brakes"]["reliability"] = document.getElementById("teamBrakeReliability").value;
    newTeam["gearbox"] = {};
    newTeam["gearbox"]["performance"] = document.getElementById("teamAcc").value;
    newTeam["gearbox"]["reliability"] = document.getElementById("teamGearboxReliability").value;
    newTeam["teamDeg"] = document.getElementById("teamDeg").value;
    let carStats = {};
    let carParts = carTypes[selectedCar];
    carParts.forEach(partName => {
        let statValues = {};
        statTypes.forEach(statName => {
            statValues[statName] = document.getElementById(statName + partName).value;
        });
        carStats[partName] = statValues;
    });

    newTeam["stats"] = carStats;
    newTeam["carBalance"] = document.getElementById("carBalanceValue").value;
    DownloadFile(JSON.stringify(newTeam, null, 2), newTeam["teamName"] + ".json");
}

function carTypeChanged(){
    let newValue = document.querySelector('input[name="carType"]:checked').value;
    if(selectedCar != newValue)
    {
        carStatsDiv.replaceChildren();
        selectedCar = newValue;

        let carParts = carTypes[selectedCar];
        if(carParts == undefined)
            return;

        carParts.forEach(element1 => {
            let newLabel = document.createElement("label");
            newLabel.innerHTML = element1 + ":";
            carStatsDiv.appendChild(newLabel);
            statTypes.forEach(element2 => {
                let newInput = document.createElement("input");
                newInput.type = "number";
                newInput.min = "10";
                newInput.value = "50";
                newInput.max = "100";
                newInput.style = "width: 10%";
                newInput.id = element2 + element1;
                carStatsDiv.appendChild(newInput);
            });


            carStatsDiv.appendChild(document.createElement("br"));
            carStatsDiv.appendChild(document.createElement("br"));
        });
        
        statTypes.forEach(element => {
            let newLabel = document.createElement("label");
            newLabel.innerHTML = element + "|";
            newLabel.style = "font-size: 20px";
            carStatsDiv.appendChild(newLabel);
        });

        carStatsDiv.appendChild(document.createElement("br"));
        carStatsDiv.appendChild(document.createElement("br"));

    }
}