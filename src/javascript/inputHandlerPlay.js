export default class InputHandlerPlay{
    constructor(timingTower) {
        document.addEventListener("mousedown", event => {
            let pos = {
                x: event.clientX - 10,
                y: event.clientY - 10,
            };

            if(pos.x > 1600 || pos.y > 1200)
                return;

            timingTower.checkSelectDriver(pos);
        });
    }
}