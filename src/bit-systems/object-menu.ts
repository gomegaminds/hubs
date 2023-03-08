import { UserInputSystem } from "aframe";
import { defineQuery, hasComponent } from "bitecs";
import type { HubsWorld } from "../app";
import { HoveredRemoteRight, Interacted, ObjectMenu, ObjectMenuTarget } from "../bit-components";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import HubChannel from "../utils/hub-channel";
import type { EntityID } from "../utils/networking-types";
import { setMatrixWorld } from "../utils/three-utils";
import { isPinned } from "./networking";

function clicked(world: HubsWorld, eid: EntityID) {
    return hasComponent(world, Interacted, eid);
}

function objectMenuTarget(world: HubsWorld, menu: EntityID, sceneIsFrozen: boolean) {
    if (!sceneIsFrozen) {
        return 0;
    }

    const hovered = hoveredQuery(world);
    const target = hovered.find(eid => findAncestorWithComponent(world, ObjectMenuTarget, eid));
    return target || ObjectMenu.targetRef[menu];
}

function moveToTarget(world: HubsWorld, menu: EntityID) {
    const targetObj = world.eid2obj.get(ObjectMenu.targetRef[menu])!;
    targetObj.updateMatrices();

    const menuObj = world.eid2obj.get(menu)!;

    // TODO: position the menu more carefully...
    setMatrixWorld(menuObj, targetObj.matrixWorld);
}

function handleClicks(world: HubsWorld, menu: EntityID, hubChannel: HubChannel) {
}

function render(world: HubsWorld, menu: EntityID, frozen: boolean) {
    const target = ObjectMenu.targetRef[menu];
    const visible = !!(target && frozen);

    const obj = world.eid2obj.get(menu)!;
    obj.visible = visible;

    world.eid2obj.get(ObjectMenu.pinButtonRef[menu])!.visible = visible && !isPinned(target);
    world.eid2obj.get(ObjectMenu.unpinButtonRef[menu])!.visible = visible && isPinned(target);

    [
        ObjectMenu.cameraFocusButtonRef[menu],
        ObjectMenu.cameraTrackButtonRef[menu],
        ObjectMenu.removeButtonRef[menu],
        ObjectMenu.dropButtonRef[menu],
        ObjectMenu.inspectButtonRef[menu],
        ObjectMenu.deserializeDrawingButtonRef[menu],
        ObjectMenu.openLinkButtonRef[menu],
        ObjectMenu.refreshButtonRef[menu],
        ObjectMenu.cloneButtonRef[menu],
        ObjectMenu.rotateButtonRef[menu],
        ObjectMenu.mirrorButtonRef[menu],
        ObjectMenu.scaleButtonRef[menu]
    ].forEach(buttonRef => {
        const buttonObj = world.eid2obj.get(buttonRef)!;
        // Parent visibility doesn't block raycasting, so we must set each button to be invisible
        // TODO: Ensure that children of invisible entities aren't raycastable
        buttonObj.visible = visible;
    });
}

const hoveredQuery = defineQuery([HoveredRemoteRight]);
export function objectMenuSystem(
    world: HubsWorld,
    sceneIsFrozen: boolean,
    userinput: UserInputSystem,
    hubChannel: HubChannel
) {
    const menu = anyEntityWith(world, ObjectMenu) as EntityID | null;
    if (!menu) {
        return; // TODO: Fix initialization so that this is assigned via preload.
    }

    ObjectMenu.targetRef[menu] = objectMenuTarget(world, menu, sceneIsFrozen);
    if (ObjectMenu.targetRef[menu]) {
        moveToTarget(world, menu);
        handleClicks(world, menu, hubChannel);
    }
    render(world, menu, sceneIsFrozen);
}
