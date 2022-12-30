import { Vector3 } from "three";
import { addComponent, hasComponent } from "bitecs";
import { Reaction, Networked, ParticleEmitter } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export function inflateParticleEmitter(world: any, eid: any, componentProps: any) {
    console.log("Inflating particle emitter, got componentProps", componentProps, "we should set src with getSid");
    addComponent(world, ParticleEmitter, eid);
    ParticleEmitter.src[eid] = APP.getSid(componentProps.src.src)

    return eid;
}
