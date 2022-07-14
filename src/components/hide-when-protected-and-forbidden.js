AFRAME.registerComponent("hide-when-protected-and-forbidden", {
  schema: {
    // Hide regardless of being forbidden.
    whenProtected: { type: "boolean" }
  },
  init() {
    this._updateUI = this._updateUI.bind(this);
    this._updateUIOnStateChange = this._updateUIOnStateChange.bind(this);
    this.el.sceneEl.addEventListener("stateadded", this._updateUIOnStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this._updateUIOnStateChange);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;

      this._updateUI();
      this.targetEl.addEventListener("protected", this._updateUI);
      this.targetEl.addEventListener("unprotected", this._updateUI);
    });
  },

  remove() {
    this.el.sceneEl.removeEventListener("stateadded", this._updateUIOnStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this._updateUIOnStateChange);

    if (this.targetEl) {
      this.targetEl.removeEventListener("protected", this._updateUI);
      this.targetEl.removeEventListener("unprotected", this._updateUI);
    }
  },

  _updateUIOnStateChange(e) {
    if (e.detail !== "frozen") return;
    this._updateUI();
  },

  _updateUI() {
    if (!this.targetEl) return;
    const isProtected = this.targetEl.components.protectable && this.targetEl.components.protectable.data.protected;

    if (this.data.whenProtected) {
      this.el.object3D.visible = !isProtected;
    } else {
      const protectedAndForbidden = isProtected && !window.APP.hubChannel.canOrWillIfCreator("update_room");
      this.el.object3D.visible = !protectedAndForbidden;
    }
  }
});
