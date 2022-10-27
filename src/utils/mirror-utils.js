import { cloneMedia, closeExistingMediaMirror } from "./media-utils";
let mirrorTarget;
export function getCurrentMirroredMedia() {
  mirrorTarget = mirrorTarget || document.querySelector("#media-mirror-target");
  const mirrorEl = mirrorTarget.firstChild;
  const linkedEl = mirrorEl && mirrorEl.components["media-loader"] && mirrorEl.components["media-loader"].data.linkedEl;
  return linkedEl;
}
export async function refreshMediaMirror() {
  const linkedEl = getCurrentMirroredMedia();
  if (!linkedEl) {
    return;
  }
  await closeExistingMediaMirror();
  const { entity } = cloneMedia(
    linkedEl,
    "#linked-media",
    linkedEl.components["media-loader"].data.src,
    false,
    true,
    mirrorTarget
  );

  entity.object3D.scale.set(0.75, 0.75, 0.75);
  entity.object3D.matrixNeedsUpdate = true;

  mirrorTarget.parentEl.components["follow-in-fov"].reset();
  mirrorTarget.parentEl.object3D.visible = true;
}
