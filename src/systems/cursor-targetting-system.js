import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { CursorRaycastable } from "../bit-components";
import { waitForDOMContentLoaded } from "../utils/async-utils";

const noop = function () {};
AFRAME.registerComponent("overwrite-raycast-as-noop", {
  init() {
      /*
    this.el.object3D.raycast = noop;
    this.mesh = this.el.getObject3D("mesh");
    if (this.mesh) {
      this.mesh.raycast = noop;
    } else {
      this.el.addEventListener("model-loaded", () => {
        this.mesh = this.el.getObject3D("mesh");
        if (this.mesh) {
          this.mesh.raycast = noop;
        }
      });
    }
    */
  }
});

const cursorRaycastableQuery = defineQuery([CursorRaycastable]);
const enteredCursorRaycastableQuery = enterQuery(cursorRaycastableQuery);
const exitedCurserRaycastableQuery = exitQuery(cursorRaycastableQuery);

export class CursorTargettingSystem {
  constructor() {
    this.aframeTargets = [];
    this.targets = [];
    this.dirty = true;
    this.onMutation = this.onMutation.bind(this);
    this.onObject3DSet = this.onObject3DSet.bind(this);
    this.onObject3DRemove = this.onObject3DRemove.bind(this);
    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.onMutation);
    waitForDOMContentLoaded().then(() => {
      const scene = document.querySelector("a-scene");
      this.rightRemote = document.getElementById("right-cursor-controller");
      this.leftRemote = document.getElementById("left-cursor-controller");
      this.observer.observe(scene, { childList: true, attributes: true, subtree: true });
      scene.addEventListener("object3dset", this.onObject3DSet);
      scene.addEventListener("object3dremove", this.onObject3DRemove);
    });
  }

  tick(t) {
    let needsCombine = false;
    if (this.dirty) {
      this.aframeTargets.length = 0;
      const els = AFRAME.scenes[0].querySelectorAll(
        ".collidable, .interactable, .ui, .drawing, .occupiable-waypoint-icon, .teleport-waypoint-icon, .avatar-inspect-collider"
      );
      for (let i = 0; i < els.length; i++) {
        if (els[i].object3D) {
          this.aframeTargets.push(els[i].object3D);
        }
      }
      // Combine the targets
      this.dirty = false;
      needsCombine = true;
    }

    if (enteredCursorRaycastableQuery(APP.world).length || exitedCurserRaycastableQuery(APP.world).length) {
      needsCombine = true;
    }

    if (needsCombine) {
      this.targets.length = 0;
      this.aframeTargets.forEach(t => {
        this.targets.push(t);
      });

      const eids = cursorRaycastableQuery(APP.world);
      for (let i = 0; i < eids.length; i++) {
        this.targets.push(APP.world.eid2obj.get(eids[i]));
      }
    }

    if (this.rightRemote) {
      this.rightRemote.components["cursor-controller"].tick2(t);
    }

    if (this.leftRemote) {
      this.leftRemote.components["cursor-controller"].tick2(t, true);
    }
  }

  onObject3DSet() {
    this.dirty = true;
  }

  onObject3DRemove() {
    this.dirty = true;
  }

  onMutation(records) {
    // let's try to avoid re-querying the targets on attribute changes we know we can ignore
    if (records.some(r => r.type === "childList" || (r.type === "attributes" && r.attributeName === "class"))) {
      this.dirty = true;
    }
  }

  remove() {
    this.observer.disconnect();
    AFRAME.scenes[0].removeEventListener("object3dset", this.onObject3DSet);
    AFRAME.scenes[0].removeEventListener("object3dremove", this.onObject3DRemove);
  }
}
