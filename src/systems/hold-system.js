import { paths } from "./userinput/paths";
import { addComponent, removeComponent, defineQuery, hasComponent } from "bitecs";
import {
    Held,
    Holdable,
    Locked,
    Pinned,
    HoveredRemoteRight,
    LiveFeed,
    HeldRemoteRight,
    VideoMenuItem,
    HoveredRemoteLeft,
    HeldRemoteLeft,
    HoveredHandRight,
    HeldHandRight,
    HoveredHandLeft,
    HeldHandLeft,
    AEntity
} from "../bit-components";
import { canMove } from "../utils/permissions-utils";

const GRAB_REMOTE_RIGHT = paths.actions.cursor.right.grab;
const DROP_REMOTE_RIGHT = paths.actions.cursor.right.drop;
const GRAB_REMOTE_LEFT = paths.actions.cursor.left.grab;
const DROP_REMOTE_LEFT = paths.actions.cursor.left.drop;
const GRAB_HAND_RIGHT = paths.actions.rightHand.grab;
const DROP_HAND_RIGHT = paths.actions.rightHand.drop;
const GRAB_HAND_LEFT = paths.actions.leftHand.grab;
const DROP_HAND_LEFT = paths.actions.leftHand.drop;

function hasPermissionToGrab(world, eid) {
    return canMove(eid);
}

function grab(world, userinput, queryHovered, held, grabPath) {
    const hovered = queryHovered(world)[0];
    if (hovered && userinput.get(grabPath) && hasPermissionToGrab(world, hovered)) {
        addComponent(world, held, hovered);
        addComponent(world, Held, hovered);
        const obj = world.eid2obj.get(hovered);
        obj.userData.oldPosition = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
    }
}

function drop(world, userinput, queryHeld, held, dropPath) {
    const heldEid = queryHeld(world)[0];
    if (heldEid && userinput.get(dropPath)) {
        // TODO: Drop on ownership lost
        removeComponent(world, held, heldEid);

        const obj = world.eid2obj.get(heldEid);

        if (hasComponent(world, VideoMenuItem, heldEid)) {
            // Do not save when dragging and dropping video buttons
        } else if (obj.name === "Video" && hasComponent(world, LiveFeed, obj.parent?.eid)) {
            // Do not save when dragging and dropping screenshare and webcam objects
        } else {
            window.APP.objectHelper.change(heldEid);
        }

        const newPos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
        const oldPos = new THREE.Vector3(obj.userData.oldPosition.x, obj.userData.oldPosition.y, obj.userData.oldPosition.z);

        const command = {
            type: "move",
            eid: heldEid,
            undo: () => {
                console.log("Undoing move, setting position to old: ", oldPos);
                obj.position.set(oldPos.x, oldPos.y, oldPos.z);
                obj.updateMatrix();
            },
            redo: () => {
                console.log("Redoing move, setting position to new", newPos);
                obj.position.set(newPos.x, newPos.y, newPos.z);
                obj.updateMatrix();
            }
        };

        window.APP.commandHelper.add(command);

        if (
            !hasComponent(world, HeldRemoteRight, heldEid) &&
            !hasComponent(world, HeldRemoteLeft, heldEid) &&
            !hasComponent(world, HeldHandRight, heldEid) &&
            !hasComponent(world, HeldHandLeft, heldEid)
        ) {
            removeComponent(world, Held, heldEid);
        }
    }
}

const queryHeldRemoteRight = defineQuery([Holdable, HeldRemoteRight]);
const queryHoveredRemoteRight = defineQuery([Holdable, HoveredRemoteRight]);

const queryHeldRemoteLeft = defineQuery([Holdable, HeldRemoteLeft]);
const queryHoveredRemoteLeft = defineQuery([Holdable, HoveredRemoteLeft]);

const queryHeldHandRight = defineQuery([Holdable, HeldHandRight]);
const queryHoveredHandRight = defineQuery([Holdable, HoveredHandRight]);

const queryHeldHandLeft = defineQuery([Holdable, HeldHandLeft]);
const queryHoveredHandLeft = defineQuery([Holdable, HoveredHandLeft]);

export function holdSystem(world, userinput) {
    grab(world, userinput, queryHoveredRemoteRight, HeldRemoteRight, GRAB_REMOTE_RIGHT);
    grab(world, userinput, queryHoveredRemoteLeft, HeldRemoteLeft, GRAB_REMOTE_LEFT);
    grab(world, userinput, queryHoveredHandRight, HeldHandRight, GRAB_HAND_RIGHT);
    grab(world, userinput, queryHoveredHandLeft, HeldHandLeft, GRAB_HAND_LEFT);

    drop(world, userinput, queryHeldRemoteRight, HeldRemoteRight, DROP_REMOTE_RIGHT);
    drop(world, userinput, queryHeldRemoteLeft, HeldRemoteLeft, DROP_REMOTE_LEFT);
    drop(world, userinput, queryHeldHandRight, HeldHandRight, DROP_HAND_RIGHT);
    drop(world, userinput, queryHeldHandLeft, HeldHandLeft, DROP_HAND_LEFT);
}
