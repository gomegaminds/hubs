import {
  AEntity,
  Held,
  MediaFrame,
  MediaLoading,
  Networked,
  NetworkedMediaFrame,
  Owned,
  Rigidbody
} from "../bit-components";

function isColliding(eidA, eidB) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eidA]);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    const collidedEid = bodyData && bodyData.object3D && bodyData.object3D.eid;
    if (collidedEid === eidB) {
      return true;
    }
  }
  return false;
}


AFRAME.registerComponent("trigger-volume", {
  schema: {
    size: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    target: { type: "string" },
    componentName: { type: "string" },
    enterComponent: { type: "string" },
    enterProperty: { type: "string" },
    enterValue: {
      default: "",
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    },
    leaveComponent: { type: "string" },
    leaveProperty: { type: "string" },
    leaveValue: {
      default: "",
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    }
  },
  init() {
	  console.log("Name", this.data.componentName);

    window.APP.scene.sceneEl.object3D.traverse((child) => {
	    if(child.name === "video-"+this.data.componentName) {
		    this.target = child;
		    console.log(child);
	    }
    })
    this.playerNode = document.getElementById("avatar-pov-node");
    console.log("Will check for ", this.playerNode);
    console.log("Against", this.el.object3D);
  },

  update() {
  },

  tick() {
    if (!this.target) return;

    const colliding = isColliding(this.el.object3D, this.playerNode.object3D);

      if (colliding) {
        console.log(colliding);
        this.data.target.setAttribute(this.data.enterComponent, this.data.enterProperty, this.data.enterValue);
      } else if (!colliding) {
        this.data.target.setAttribute(this.data.leaveComponent, this.data.leaveProperty, this.data.leaveValue);
      }
  }
});
