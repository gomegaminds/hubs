import { addComponent } from "bitecs";
import { Link } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";
import { createCSS2DObject } from "../mega-src/utils/create-css2d-object";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { Text as TroikaText } from "troika-three-text";
import { Text, TextButton } from "../bit-components";

export function inflateLink(world, eid, params) {
    console.log("Actually got to link Inflator", params.link);
    addComponent(world, Link, eid);
    Link.url[eid] = APP.getSid(params.link);


    addComponent(world, Text, eid);
    const text = new TroikaText();
    text.text = params.link 
    text.textAlign = "center"
    text.overflowWrap = "break-word"
    text.maxWidth = 0.5;
    text.fontSize = 0.06;

    console.log(text);

    text.sync();
    addObject3DComponent(world, eid, text);


    return eid;
}
