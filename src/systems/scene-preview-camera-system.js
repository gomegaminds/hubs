import { CAMERA_MODE_INSPECT } from "./camera-system.js";
import { setMatrixWorld } from "../utils/three-utils";

let viewingCamera;
export class ScenePreviewCameraSystem {
  constructor() {
    this.entities = [];
  }

  register(el) {
    this.entities.push(el);
  }

  unregister(el) {
    this.entities.splice(this.entities.indexOf(el), 1);
  }

  tick() {
    viewingCamera = viewingCamera || document.getElementById("viewing-camera");
    const entered = viewingCamera && viewingCamera.sceneEl.is("entered");
    for (let i = 0; i < this.entities.length; i++) {
      const el = this.entities[i];
      const hubsSystems = AFRAME.scenes[0].systems["hubs-systems"];
      if (el && (!hubsSystems || (hubsSystems.cameraSystem.mode !== CAMERA_MODE_INSPECT && !entered))) {
        el.components["scene-preview-camera"].tick2();
        if (hubsSystems && viewingCamera) {
          el.object3D.updateMatrices();
          setMatrixWorld(viewingCamera.object3DMap.camera, el.object3D.matrixWorld);
        }
      }
    }
  }
}
