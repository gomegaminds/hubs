import { addComponent } from "bitecs";
import { YouTube } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";
import { createCSS3DObject } from "../mega-src/utils/create-css3d-object";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

export function inflateYouTube(world, eid, params) {
    console.log("Actually got to Youtube Inflator", params);


    const obj3d = createCSS3DObject(params.link);


    addComponent(world, YouTube, eid);

    YouTube.obj3d[eid] = APP.getSid(obj3d);
    addObject3DComponent(world, eid, obj3d);

    console.log("Adding youtube to object", obj3d);

    return eid;
}
