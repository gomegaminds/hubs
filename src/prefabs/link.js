/** @jsx createElementEntity */
import { createElementEntity, EntityDef, createRef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { MediaLoaderParams } from "../inflators/media-loader";
import linkbg from "../assets/images/link-bg.png";
import { Button3D, BUTTON_TYPES } from "./button3D";

export function Label({ text = {}, ...props }, ...children) {
    const value = children.join("\n");
    return <entity name="Label" text={{ value, ...text }} layers={1 << Layers.CAMERA_LAYER_UI} {...props} />;
}

export function LinkPrefab({ url }) {
    console.log("LinkPrefab", url);

    const openRef = createRef();
    const buttonScale = [0.4, 0.4, 0.4];
    const uiZ = 0.1;
    const buttonHeight = 0.2;

    return (
        <entity
            name="Link"
            networked
            link={{ link: url }}
            networkedTransform
            billboard
            locked
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
        >
            <Button3D
                ref={openRef}
                scale={buttonScale}
                position={[0.0, 0.1, uiZ]}
                width={0.6}
                height={buttonHeight}
                text={"Open Link"}
            />
        </entity>
    );
}
