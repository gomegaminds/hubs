import { addComponent, addEntity, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Question } from "../bit-components";

const questionQuery = defineQuery([Question]);
const questionEnterQuery = enterQuery(questionQuery);


const worldPos = new THREE.Vector3();

export function questionSystem(world) {
    questionEnterQuery(world).forEach(function (eid) {
        // Initialize all the questions here
        const refObject = APP.getString(Question.obj2d[eid]);
        const question = world.eid2obj.get(eid);
        console.log("got question component", question, eid, refObject);
    });

    questionQuery(world).forEach(function (eid) {
        // Initialize all the questions here
        const refObject = APP.getString(Question.obj2d[eid]);
        const question = world.eid2obj.get(eid);

        const avatarPovObject = document.getElementById("avatar-pov-node").object3D;
        avatarPovObject.getWorldPosition(worldPos);

        if (worldPos.distanceTo(question.position) < 2) {
            question.element.style.pointerEvents = "all";
            question.element.style.opacity = 1;
        } else if (worldPos.distanceTo(question.position) < 3) {
            question.element.style.opacity = 0.5;
            question.element.style.pointerEvents = "none";
        } else {
            question.element.style.opacity = 0;
            question.element.style.pointerEvents = "none";
        }
    });
}
