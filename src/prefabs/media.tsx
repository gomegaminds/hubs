/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { MediaLoaderParams } from "../inflators/media-loader";

export function MediaPrefab(params: MediaLoaderParams): EntityDef {
    return (
        <entity
            name="Interactable Media"
            networked
            networkedTransform
            billboard
            locked
            description
            nickname
            studentsCanMove
            stickynote={{ toggled: false }}
            equirectangular
            mediaLoader={params}
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
