import { addComponent } from "bitecs";
import { Question } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { ProjectionMode } from "../utils/projection-mode";
import { createCSS2DObject } from "../mega-src/utils/create-css2d-object";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

export function inflateQuestion(world, eid, params) {
    console.log("Actually got to Question Inflator", params);

    const questionContainer = createCSS2DObject(params.questions, "Example Title");
    const obj2d = new CSS2DObject(questionContainer);

    addComponent(world, Question, eid);

    Question.obj2d[eid] = APP.getSid(obj2d);
    addObject3DComponent(world, eid, obj2d);

    return eid;
}
