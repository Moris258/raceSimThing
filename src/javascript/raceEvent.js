export const EventTypes = Object.freeze({
    raceEnd: "RaceEnd",
    weekendEnd: "WeekendEnd",
    lapEnd: "LapEnd",
});

export default class RaceEventLog{
    constructor() {
        this.messages = [];
    }

    update(eventArgs, type){
        switch(type){
            case EventTypes.raceEnd:
                this.logMessage(eventArgs["text"]);
                break;
            case EventTypes.weekendEnd:
                this.printMessages();
                break;
        }
    }

    logMessage(text){
        if(!text) return console.error("RaceEventLog provided with empty text.");

        this.messages.push(text);
    }

    printMessages(){
        this.messages.forEach(element => {
            console.log(element);
        });
    }
}
export class RacePublisher{
    constructor(type) {
        this.subscribers = [];
        this.type = type;
    }

    subscribe(subscriber){
        this.subscribers.push(subscriber);
    }

    unsubscribe(subscriber){
        this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
    }

    publish(eventArgs){
        this.subscribers.forEach(element => {
            element.update(eventArgs, this.type);
        });
    }

}