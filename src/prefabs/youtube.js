/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { MediaLoaderParams } from "../inflators/media-loader";

import question_model from "../assets/models/question.glb";

export function YouTubePrefab({ src, recenter, resize, link }) {
    return (
        <entity
            name="Youtube"
            networked
            youtube={{ link: link }}
            networkedTransform
            billboard
            nickname
            locked
            description
            studentsCanMove
            mediaLoader={{ src, recenter, resize }}
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
