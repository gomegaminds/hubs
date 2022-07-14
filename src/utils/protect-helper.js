import pinnedEntityToGltf from "./pinned-entity-to-gltf";
import { getPromotionTokenForFile } from "./media-utils";
import { SignInMessages } from "../react-components/auth/SignInModal";

export default class ProtectHelper {
  constructor(hubChannel, authChannel, store, performConditionalSignIn) {
    this.hubChannel = hubChannel;
    this.authChannel = authChannel;
    this.store = store;
    this.performConditionalSignIn = performConditionalSignIn;
  }

  async setProtected(el, protect) {
    if (NAF.utils.isMine(el)) {
      this._signInAndProtectOrUnprotectElement(el, protect);
    } else {
      console.warn("PinningHelper: Attempted to set protect state on object that was not mine.");
    }
  }

  _signInAndProtectOrUnprotectElement = (el, protect) => {
    const action = protect ? () => this._protectElement(el) : () => this.unprotectElement(el);

    this.performConditionalSignIn(
      () => this.hubChannel.signedIn,
      action,
      protect ? SignInMessages.protect : SignInMessages.protect,
      e => {
        console.warn(`ProtectionHelper: Conditional sign-in failed. ${e}`);
      }
    );
  };

  async _protectElement(el) {
    const { networkId } = el.components.networked.data;

    const { fileId, src } = el.components["media-loader"].data;
    let fileAccessToken, promotionToken;
    if (fileId) {
      fileAccessToken = new URL(src).searchParams.get("token");
      const storedPromotionToken = getPromotionTokenForFile(fileId);
      if (storedPromotionToken) {
        promotionToken = storedPromotionToken.promotionToken;
      }
    }

    const gltfNode = pinnedEntityToGltf(el);
    if (!gltfNode) {
      console.warn("PinningHelper: Entity did not produce a GLTF node.");
      return;
    }
    el.setAttribute("networked", { persistent: true });
    el.setAttribute("media-loader", { fileIsOwned: true });

    try {
      await this.hubChannel.protect(networkId, gltfNode, fileId, fileAccessToken, promotionToken);

      // If we lost ownership of the entity while waiting for the protect to go through,
      // try to regain ownership before setting the "protected" state.
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) {
        console.warn("PinningHelper: Protection succeeded, but ownership was lost in the mean time");
      }

      el.setAttribute("protectable", "protected", true);
      el.emit("protected", { el });
      this.store.update({ activity: { hasProtected: true } });
    } catch (e) {
      if (e.reason === "invalid_token") {
        await this.authChannel.signOut(this.hubChannel);
        this._signInAndProtectOrUnprotectElement(el);
      } else {
        console.warn("ProtectionHelper: Protect failed for unknown reason", e);
      }
    }
  }

  unprotectElement(el) {
    const components = el.components;
    const networked = components.networked;

    if (!networked || !networked.data || !NAF.utils.isMine(el)) {
      console.warn("ProtectionHelper: Tried to unprotect element that is not networked or not mine.");
      return;
    }

    const networkId = components.networked.data.networkId;
    el.setAttribute("networked", { persistent: false });

    const mediaLoader = components["media-loader"];
    const fileId = mediaLoader.data && mediaLoader.data.fileId;

    this.hubChannel.unprotect(networkId, fileId);
    el.setAttribute("protectable", "protected", false);
    el.emit("unprotected", { el });
  }
}
