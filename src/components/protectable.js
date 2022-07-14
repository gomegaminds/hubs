AFRAME.registerComponent("protectable", {
  schema: {
    protected: { default: false }
  },

  init() {
    this._persist = this._persist.bind(this);
    this._persistAndAnimate = this._persistAndAnimate.bind(this);

    // Persist when media is refreshed since the version will be bumped.
    this.el.addEventListener("media_refreshed", this._persistAndAnimate);

    this.el.addEventListener("owned-pager-page-changed", this._persist);

    this.el.addEventListener("owned-video-state-changed", this._persistAndAnimate);
  },

  update() {
    this._animate();
  },

  _persistAndAnimate() {
    this._persist();
  },

  _persist() {
    // Re-protect or unprotect entity to reflect state changes.
    window.APP.protectHelper.setProtected(this.el, this.data.protected);
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
