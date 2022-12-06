import { addComponent, removeComponent } from "bitecs";
import { Pinnable, Pinned } from "../bit-components";

AFRAME.registerComponent("pinnable", {
    schema: {
        pinned: { default: false }
    },

    init() {
        this._persist = this._persist.bind(this);

        // Persist when media is refreshed since the version will be bumped.
        this.el.addEventListener("media_refreshed", this._persist);

        this.el.addEventListener("owned-pager-page-changed", this._persist);

        this.el.addEventListener("owned-video-state-changed", this._persist);

        addComponent(APP.world, Pinnable, this.el.object3D.eid);
    },

    update() {
        if (this.data.pinned) {
            addComponent(APP.world, Pinned, this.el.object3D.eid);
        } else {
            removeComponent(APP.world, Pinned, this.el.object3D.eid);
        }
    },

    _persist() {
        // Re-pin or unpin entity to reflect state changes.
        window.APP.objectHelper.change(this.el);
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
            this._persist();
        }

        this.wasHeld = isHeld;
    }
});
