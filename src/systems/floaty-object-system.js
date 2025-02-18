const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
import {
    enterQuery,
    addComponent,
    removeComponent,
    defineComponent,
    defineQuery,
    exitQuery,
    hasComponent,
    Not,
    entityExists,
} from "bitecs";
import { FloatyObject, Owned, Rigidbody, MakeKinematicOnRelease, Constraint } from "../bit-components";

export const MakeStaticWhenAtRest = defineComponent();

const makeStaticAtRestQuery = defineQuery([FloatyObject, Rigidbody, Not(Constraint), MakeStaticWhenAtRest]);
function makeStaticAtRest(world) {
    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
    makeStaticAtRestQuery(world).forEach((eid) => {
        const isMine = hasComponent(world, Owned, eid);
        if (!isMine) {
            removeComponent(world, MakeStaticWhenAtRest, eid);
            return;
        }

        const bodyId = Rigidbody.bodyId[eid];
        const bodyData = physicsSystem.bodyUuidToData.get(bodyId);
        const isAtRest =
            physicsSystem.bodyInitialized(bodyId) &&
            physicsSystem.getLinearVelocity(bodyId) < bodyData.options.linearSleepingThreshold &&
            physicsSystem.getAngularVelocity(bodyId) < bodyData.options.angularSleepingThreshold;

        if (isAtRest) {
            Object.assign(bodyData.options, {
                type: "kinematic",
            });
            physicsSystem.updateBody(bodyId, bodyData.options);
            removeComponent(world, MakeStaticWhenAtRest, eid);
        }
    });
}

const makeKinematicOnReleaseExitQuery = exitQuery(defineQuery([Rigidbody, Constraint, MakeKinematicOnRelease]));
function makeKinematicOnRelease(world) {
    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
    makeKinematicOnReleaseExitQuery(world).forEach((eid) => {
        if (!entityExists(world, eid) || !hasComponent(world, Owned, eid)) return;
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], { type: "kinematic" });
    });
}

export const FLOATY_OBJECT_FLAGS = {
    MODIFY_GRAVITY_ON_RELEASE: 1 << 0,
    REDUCE_ANGULAR_FLOAT: 1 << 1,
    UNTHROWABLE: 1 << 2,
};

const enteredFloatyObjectsQuery = enterQuery(defineQuery([FloatyObject, Rigidbody]));
const heldFloatyObjectsQuery = defineQuery([FloatyObject, Rigidbody, Constraint]);
const exitedHeldFloatyObjectsQuery = exitQuery(heldFloatyObjectsQuery);
const enterHeldFloatyObjectsQuery = enterQuery(heldFloatyObjectsQuery);
export const floatyObjectSystem = (world) => {
    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

    enteredFloatyObjectsQuery(world).forEach((eid) => {
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], {
            type: "kinematic",
            gravity: { x: 0, y: 0, z: 0 },
        });
    });

    enterHeldFloatyObjectsQuery(world).forEach((eid) => {
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], {
            gravity: { x: 0, y: 0, z: 0 },
            type: "dynamic",
            collisionFilterMask: COLLISION_LAYERS.HANDS | COLLISION_LAYERS.MEDIA_FRAMES,
        });
    });

    exitedHeldFloatyObjectsQuery(world).forEach((eid) => {
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], {
            gravity: { x: 0, y: 0, z: 0 },
            type: "static"
        });
    });

    makeStaticAtRest(world);
    makeKinematicOnRelease(world);
};
