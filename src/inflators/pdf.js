import { addComponent } from "bitecs";
import { MediaPDF } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";

export function inflatePDF(world, eid, { texture, ratio, index, page }) {
    const mesh = createImageMesh(texture, ratio, "blend");
    addObject3DComponent(world, eid, mesh);
    addComponent(world, MediaPDF, eid);

    MediaPDF.index[eid] = APP.getSid(index);
    MediaPDF.pageRef[eid] = APP.getSid(page);

    console.log(APP.getSid(index));

    return eid;
}
