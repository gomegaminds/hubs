import { paths } from "./userinput/paths";
import { addComponent, removeComponent, defineQuery, hasComponent } from "bitecs";
import {
    Held,
    Gizmo,
    GizmoGrabbed,
    Holdable,
    Pinned,
    HoveredRemoteRight,
    HeldRemoteRight,
    HeldGizmoRight,
    HoveredGizmoRight,
    HoveredRemoteLeft,
    HeldRemoteLeft,
    HoveredHandRight,
    HeldHandRight,
    HoveredHandLeft,
    HeldHandLeft,
    AEntity,
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
    if (!hasComponent(world, AEntity, eid)) return true;
    return canMove(world.eid2obj.get(eid).el);
}

function isGizmo(world, eid) {
    const result = hasComponent(world, Gizmo, eid);
    return result;
}

function grab(world, userinput, queryHovered, held, grabPath) {
    const hovered = queryHovered(world)[0];

    if (hovered && !isGizmo(world, hovered) && userinput.get(grabPath) && hasPermissionToGrab(world, hovered)) {
        addComponent(world, held, hovered);
        addComponent(world, Held, hovered);
        console.log("Grabbing normal object");
    }

    if (hovered && isGizmo(world, hovered) && userinput.get(grabPath)) {
        console.log("Grabbing gizmo object");
        addComponent(world, GizmoGrabbed, hovered);
        addComponent(world, held, hovered);
    }
}

function drop(world, userinput, queryHeld, held, dropPath) {
    const heldEid = queryHeld(world)[0];
    if (heldEid && userinput.get(dropPath)) {
        // TODO: Drop on ownership lost
        removeComponent(world, held, heldEid);

        if (hasComponent(world, GizmoGrabbed, heldEid)) {
            removeComponent(world, GizmoGrabbed, heldEid);
            removeComponent(world, held, heldEid);
        }

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

const queryHeldGizmoRight = defineQuery([Holdable, HeldGizmoRight]);
const queryHoveredGizmoRight = defineQuery([Holdable, HoveredGizmoRight]);

const queryHeldRemoteLeft = defineQuery([Holdable, HeldRemoteLeft]);
const queryHoveredRemoteLeft = defineQuery([Holdable, HoveredRemoteLeft]);

const queryHeldHandRight = defineQuery([Holdable, HeldHandRight]);
const queryHoveredHandRight = defineQuery([Holdable, HoveredHandRight]);

const queryHeldHandLeft = defineQuery([Holdable, HeldHandLeft]);
const queryHoveredHandLeft = defineQuery([Holdable, HoveredHandLeft]);

export function holdSystem(world, userinput) {
    // grab(world, userinput, queryHoveredGizmoLeft, HeldGizmoLeft, GRAB_REMOTE_LEFT);
    grab(world, userinput, queryHoveredGizmoRight, HeldGizmoRight, GRAB_REMOTE_RIGHT);
    grab(world, userinput, queryHoveredRemoteRight, HeldRemoteRight, GRAB_REMOTE_RIGHT);
    grab(world, userinput, queryHoveredRemoteLeft, HeldRemoteLeft, GRAB_REMOTE_LEFT);
    grab(world, userinput, queryHoveredHandRight, HeldHandRight, GRAB_HAND_RIGHT);
    grab(world, userinput, queryHoveredHandLeft, HeldHandLeft, GRAB_HAND_LEFT);

    drop(world, userinput, queryHeldGizmoRight, HeldGizmoRight, DROP_REMOTE_RIGHT);
    drop(world, userinput, queryHeldRemoteRight, HeldRemoteRight, DROP_REMOTE_RIGHT);
    drop(world, userinput, queryHeldRemoteLeft, HeldRemoteLeft, DROP_REMOTE_LEFT);
    drop(world, userinput, queryHeldHandRight, HeldHandRight, DROP_HAND_RIGHT);
    drop(world, userinput, queryHeldHandLeft, HeldHandLeft, DROP_HAND_LEFT);
}
