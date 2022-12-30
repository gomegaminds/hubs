import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";
import { MediaAudio } from "../bit-components";
import { audioTexture } from "../utils/audio-texture";

export function inflateAudio(world, eid, element) {
    const mesh = createImageMesh(audioTexture, 2);
    addObject3DComponent(world, eid, mesh);
    addComponent(world, MediaAudio, eid);
    return eid;
}
