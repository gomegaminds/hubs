import { addComponent } from "bitecs";
import { MediaPDF } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";

export function inflatePDF(world, eid, { texture, ratio, index, page }) {
    const mesh = createImageMesh(texture, ratio, "blend");
    addObject3DComponent(world, eid, mesh);
    addComponent(world, MediaPDF, eid);
    

    console.log("got page to set max pages from", page.pageCount);

    MediaPDF.index[eid] = index;
    MediaPDF.pageRef[eid] = APP.getSid(page);
    MediaPDF.pageCount[eid] = page.pageCount;

    return eid;
}
