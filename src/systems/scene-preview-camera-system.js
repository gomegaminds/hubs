import { CAMERA_MODE_INSPECT } from "./camera-system.js";
import { setMatrixWorld } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";

export class ScenePreviewCameraSystem {
    constructor() {
        this.entities = [];
        waitForDOMContentLoaded().then(() => {
            this.DOMContentDidLoad = true;
            console.log("Scene Preview Camera System initialized");
            this.viewingCamera = document.getElementById("viewing-camera");
        });
    }

    register(el) {
        this.entities.push(el);
    }

    unregister(el) {
        this.entities.splice(this.entities.indexOf(el), 1);
    }

    tick() {
        const entered = this.viewingCamera && this.viewingCamera.sceneEl.is("entered");
        for (let i = 0; i < this.entities.length; i++) {
            const el = this.entities[i];
            const hubsSystems = AFRAME.scenes[0].systems["hubs-systems"];
            if (el && (!hubsSystems || (hubsSystems.cameraSystem.mode !== CAMERA_MODE_INSPECT && !entered))) {
                el.components["scene-preview-camera"].tick2();
                if (hubsSystems && this.viewingCamera) {
                    el.object3D.updateMatrices();
                    setMatrixWorld(this.viewingCamera.object3DMap.camera, el.object3D.matrixWorld);
                }
            }
        }
    }
}
