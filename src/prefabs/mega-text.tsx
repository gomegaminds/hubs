/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { MediaLoaderParams } from "../inflators/media-loader";

export function MegaTextPrefab(params: any): EntityDef {
    return (
        <entity
            name="Interactable Text"
            networked
            networkedTransform
            billboard
            locked
            text={params}
            description
            studentsCanMove
            deletable
            grabbable={{ cursor: true, hand: true }}
            destroyAtExtremeDistance
            floatyObject={{
                flags: FLOATY_OBJECT_FLAGS.UNTHROWABLE,
                releaseGravity: 0
            }}
            rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
            scale={[1, 1, 1]}
        />
    );
}
