import { addComponent, addEntity } from "bitecs";
import { MegaText } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export function inflateMegaText(world, eid, payload) {

    addComponent(world, MegaText, eid);

    const text = new TroikaText();
    text.text = payload.value;
    text.maxWidth = payload.maxWidth
    text.textAlign = payload.align
    text.color = payload.color;
    text.sync();

    addObject3DComponent(world, eid, text);
}
