import { paths } from "../systems/userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
const AMMO_BODY_ATTRIBUTES = { type: "kinematic", collisionFilterMask: COLLISION_LAYERS.HANDS };

export const TRANSFORM_MODE = {
  AXIS: "axis",
  PUPPET: "puppet",
  CURSOR: "cursor",
  ALIGN: "align",
  SCALE: "scale"
};

const STEP_LENGTH = Math.PI / 10;
const CAMERA_WORLD_QUATERNION = new THREE.Quaternion();
const CAMERA_WORLD_POSITION = new THREE.Vector3();
const TARGET_WORLD_QUATERNION = new THREE.Quaternion();
const v = new THREE.Vector3();
const v2 = new THREE.Vector3();
const q = new THREE.Quaternion();
const q2 = new THREE.Quaternion();

const eps = 0.001;
function qAlmostEquals(a, b) {
  return (
    Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps && Math.abs(a.w - b.w) < eps
  );
}

AFRAME.registerComponent("transform-y-button", {
  schema: {
    mode: {
      type: "string",
      oneof: Object.values(TRANSFORM_MODE),
      default: TRANSFORM_MODE.CURSOR
    },
    axis: { type: "vec3", default: null }
  },
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
    let leftHand, rightHand;

    waitForDOMContentLoaded().then(() => {
      leftHand = document.getElementById("player-left-controller");
      rightHand = document.getElementById("player-right-controller");
    });
    this.onGrabStart = e => {
      if (!leftHand || !rightHand) return;

      if (!this.targetEl) {
        return;
      }
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) {
        return;
      }
      if (this.targetEl.body) {
        this.targetEl.setAttribute("body-helper", AMMO_BODY_ATTRIBUTES);
      }
      this.transformSystem = this.transformSystem || AFRAME.scenes[0].systems["transform-y-selected-object"];
      this.transformSystem.startTransform(
        this.targetEl.object3D,
        e.object3D.el.id === "right-cursor"
          ? rightHand.object3D
          : e.object3D.el.id === "left-cursor"
            ? leftHand.object3D
            : e.object3D,
        this.data
      );
    };
    this.onGrabEnd = () => {
      this.transformSystem = this.transformSystem || AFRAME.scenes[0].systems["transform-y-selected-object"];
      this.transformSystem.stopTransform();
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-up", this.onGrabEnd);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-up", this.onGrabEnd);
  }
});
