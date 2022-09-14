import { addComponent, removeComponent } from "bitecs";
import { Pinnable, Pinned } from "../bit-components";

AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this._persist = this._persist.bind(this);
    this._persistAndAnimate = this._persistAndAnimate.bind(this);

    // Persist when media is refreshed since the version will be bumped.
    this.el.addEventListener("media_refreshed", this._persistAndAnimate);

    this.el.addEventListener("owned-pager-page-changed", this._persist);

    this.el.addEventListener("owned-video-state-changed", this._persistAndAnimate);

    addComponent(APP.world, Pinnable, this.el.object3D.eid);
  },

  update() {

    if (this.data.pinned) {
      addComponent(APP.world, Pinned, this.el.object3D.eid);
    } else {
      removeComponent(APP.world, Pinned, this.el.object3D.eid);
    }
  },

  _persistAndAnimate() {
    this._persist();
  },

  _persist() {
    // Re-pin or unpin entity to reflect state changes.
    window.APP.pinningHelper.setPinned(this.el, this.data.pinned);
  },

  _isMine() {
    return this.el.components.networked?.data && NAF.utils.isMine(this.el);
  },

  tick() {
    const isHeld = this.el.sceneEl.systems.interaction.isHeld(this.el);
    const isMine = this._isMine();

    let didFireThisFrame = false;
    if (!isHeld && this.wasHeld && isMine) {
      didFireThisFrame = true;
      this._persistAndAnimate();
    }

    this.wasHeld = isHeld;

    this.transformObjectSystem = this.transformObjectSystem || AFRAME.scenes[0].systems["transform-selected-object"];
    const transforming = this.transformObjectSystem.transforming && this.transformObjectSystem.target.el === this.el;
    if (!didFireThisFrame && !transforming && this.wasTransforming && isMine) {
      this._persistAndAnimate();
    }
    this.wasTransforming = transforming;
  }
});
