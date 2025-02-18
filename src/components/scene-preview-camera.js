import { setMatrixWorld } from "../utils/three-utils";
import { CAMERA_MODE_SCENE_PREVIEW } from "../systems/camera-system";

function lerp(start, end, t) {
    return (1 - t) * start + t * end;
}

const newRot = new THREE.Quaternion();

/**
 * Nicely pans the camera for previewing a scene. There's some weirdness with this right now
 * since it ends up panning in a direction dependent upon the start camera orientation,
 * but it's good enough for now.
 */
AFRAME.registerComponent("scene-preview-camera", {
    schema: {
        duration: { default: 90, type: "number" },
        positionOnly: { default: false, type: "boolean" }
    },

    init: function () {
        const systems = AFRAME.scenes[0].systems["hubs-systems"] || AFRAME.scenes[0].systems["scene-systems"];

        if (systems) {
            systems.scenePreviewCameraSystem.register(this.el);
        }

        this.startPoint = this.el.object3D.position.clone();
        this.startRotation = this.el.object3D.quaternion.clone();

        this.targetPoint = this.el.object3D.position.clone();
        this.targetPoint.y = Math.max(this.targetPoint.y - 1.5, 1);
        this.targetPoint.add(new THREE.Vector3(2, 0, -2));

        const targetRotDelta = new THREE.Euler(-0.15, 0.0, 0.15);
        this.targetRotation = new THREE.Quaternion();
        this.targetRotation.setFromEuler(targetRotDelta);
        this.targetRotation.premultiply(this.startRotation);

        this.startTime = performance.now();
        this.backwards = false;
        this.ranOnePass = false;
    },

    tick2: function () {
        const hubsSystems = this.el.sceneEl.systems["hubs-systems"];

        if (hubsSystems) {
            hubsSystems.cameraSystem.mode = CAMERA_MODE_SCENE_PREVIEW;
        }

        let t = (performance.now() - this.startTime) / (1000.0 * this.data.duration);
        t = Math.min(1.0, Math.max(0.0, t));

        if (!this.ranOnePass) {
            t = t * (2 - t);
        } else {
            t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        const from = this.backwards ? this.targetPoint : this.startPoint;
        const to = this.backwards ? this.startPoint : this.targetPoint;
        const fromRot = this.backwards ? this.targetRotation : this.startRotation;
        const toRot = this.backwards ? this.startRotation : this.targetRotation;

        newRot.slerpQuaternions(fromRot, toRot, t);

        this.el.object3D.position.set(lerp(from.x, to.x, t), lerp(from.y, to.y, t), lerp(from.z, to.z, t));

        if (!this.data.positionOnly) {
            this.el.object3D.rotation.setFromQuaternion(newRot);
        }

        this.el.object3D.matrixNeedsUpdate = true;

        if (t >= 0.9999) {
            this.ranOnePass = true;
            this.backwards = !this.backwards;
            this.startTime = performance.now();
        }
    },

    remove: function () {
        const systems = AFRAME.scenes[0]?.systems["hubs-systems"] || AFRAME.scenes[0]?.systems["scene-systems"];

        if (systems) {
            systems.scenePreviewCameraSystem.unregister(this.el);
        }
    }
});
