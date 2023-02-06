import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";
import { MediaVideo, CursorRaycastable, LiveFeed, Holdable, RemoteHoverTarget, OffersRemoteConstraint } from "../bit-components";

export function inflateVideo(world, eid, { texture, ratio, projection, autoPlay, live }) {
    const mesh =
        projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
            ? create360ImageMesh(texture, ratio)
            : createImageMesh(texture, ratio);
    addObject3DComponent(world, eid, mesh);
    addComponent(world, MediaVideo, eid);
    if (live) {
        addComponent(world, LiveFeed, eid);
    }

    MediaVideo.autoPlay[eid] = false; // For now, todo: reimplement autoplay
    console.log(eid);

    return eid;
}
