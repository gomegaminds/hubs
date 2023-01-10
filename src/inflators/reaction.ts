import { Vector3 } from "three";
import { addComponent, hasComponent } from "bitecs";
import { Reaction, Networked, ParticleEmitter } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export type ParticleEmitterParams = {
    src: string;
    resolve: boolean;
    particleCount: number;
    startSize: number,
    endSize: number,
    sizeRandomness: number,
    lifetime: number,
    lifetimeRandomness: number,
    ageRandomness: number,
    startVelocity: Vector3,
    endVelocity: Vector3,
    startOpacity: number,
    middleOpacity: number,
    endOpacity: number,
};

export function inflateReaction(world: any, eid: any, componentProps: any) {
    console.log("Inflating reaction, got componentProps");

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.02, 0.02),
        new THREE.MeshBasicMaterial({
            color: 0xff0000,
        })
    );
    addObject3DComponent(world, eid, mesh);
    addComponent(world, Reaction, eid);
    addComponent(world, ParticleEmitter, eid);
    if (!hasComponent(world, Networked, eid)) addComponent(world, Networked, eid);

    console.log("Inflated reaction with ", eid);
    return eid;
}
