export class CameraInputHandler{
    constructor(camera) {
        document.addEventListener("keypress", event => {
            camera.moveCamera(event.code);
        })
    }
}

export class Camera{
    constructor() {
        this.pos = {
            x: 0,
            y: 0,
        };
        this.inputHandler = new CameraInputHandler(this);
    }

    setCameraPos(pos){
        this.pos.x = pos.x;
        this.pos.y = pos.y;
    }

    moveCamera(key){
        switch(key){
            case "KeyW":
                this.pos.y -= 10;
                break;
            case "KeyS":
                this.pos.y += 10;
                break;
            case "KeyA":
                this.pos.x -= 10;
                break;
            case "KeyD":
                this.pos.x += 10;
                break;
        }
    }
}