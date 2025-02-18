import { addComponent, removeComponent, removeEntity, defineQuery, hasComponent } from "bitecs";
import {
    HoverButton,
    HoveredHandLeft,
    PDFSettingsChanged,
    Link,
    MediaPDF,
    MediaAudio,
    MediaVideo,
    HoveredHandRight,
    HoveredRemoteLeft,
    HoveredRemoteRight,
    Interacted,
    SingleActionButton,
    TextButton
} from "../bit-components";
import { hasAnyComponent } from "../utils/bit-utils";
import { CAMERA_MODE_INSPECT } from "./camera-system";
import { paths } from "./userinput/paths";

function interact(world, entities, path, interactor) {
    if (AFRAME.scenes[0].systems.userinput.get(path)) {
        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            addComponent(world, Interacted, eid);

            const obj = world.eid2obj.get(eid);

            if (obj.parent && hasComponent(world, MediaAudio, obj.parent.eid)) {
                if (obj.name === "play") {
                    obj.parent.children[0].play();
                }
                if (obj.name === "pause") {
                    obj.parent.children[0].pause();
                }
            }

            if (obj.parent && obj.parent.parent && hasComponent(world, MediaVideo, obj.parent.parent.eid)) {
                const videoObject = obj.parent.parent.material.map.image;

                if (obj.name === "play") {
                    videoObject.play();
                } else if (obj.name === "pause") {
                    videoObject.pause();
                }
                if (obj.name === "stopSharing") {
                    console.log("STOP SHARING", obj);
                    removeEntity(world, obj.parent.parent.eid);
                    window.APP.scene.emit("video_share_ended");
                }
            }

            if (obj.parent && hasComponent(world, MediaPDF, obj.parent.eid)) {
                if (obj.name === "next") {
                    const newIndex = MediaPDF.index[obj.parent.eid] + 1;

                    if (newIndex <= MediaPDF.pageCount[obj.parent.eid]) {
                        addComponent(world, PDFSettingsChanged, obj.parent.eid);
                        PDFSettingsChanged.newIndex[obj.parent.eid] = newIndex;
                        MediaPDF.index[obj.parent.eid] = newIndex;
                    }
                }
                if (obj.name === "prev") {
                    const newIndex = MediaPDF.index[obj.parent.eid] - 1;
                    if (newIndex > 0) {
                        addComponent(world, PDFSettingsChanged, obj.parent.eid);
                        PDFSettingsChanged.newIndex[obj.parent.eid] = newIndex;
                        MediaPDF.index[obj.parent.eid] = newIndex;
                    }
                }
            }

            if (obj.parent && hasComponent(world, Link, obj.parent.eid)) {
                let url = APP.getString(Link.url[obj.parent.eid]);
                if (!/^https?:\/\//i.test(url)) {
                    url = "https://" + url;
                }
                window.open(url);
            }

            // TODO: New systems should not listen for this event
            // Delete this when we're done interoping with old world systems
            world.eid2obj.get(eid).dispatchEvent({
                type: "interact",
                object3D: interactor
            });
        }
    }
}

const interactedQuery = defineQuery([Interacted]);
const rightRemoteQuery = defineQuery([SingleActionButton, HoveredRemoteRight]);
const leftRemoteQuery = defineQuery([SingleActionButton, HoveredRemoteLeft]);

function singleActionButtonSystem(world) {
    // Clear the interactions from previous frames
    const interactedEnts = interactedQuery(world);
    for (let i = 0; i < interactedEnts.length; i++) {
        const eid = interactedEnts[i];
        removeComponent(world, Interacted, eid);
    }

    if (AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT) {
        // TODO: Fix issue where button objects are "visible" but not on the inspect layer,
        // which makes it so we can interact with them but cannot see them.
        return;
    }

    const interactorSettings = AFRAME.scenes[0].systems.interaction.options;
    interact(
        world,
        leftRemoteQuery(world),
        paths.actions.cursor.left.grab,
        interactorSettings.leftRemote.entity.object3D
    );
    interact(
        world,
        rightRemoteQuery(world),
        paths.actions.cursor.right.grab,
        interactorSettings.rightRemote.entity.object3D
    );
}

export const BUTTON_TYPES = {
    DEFAULT: 0,
    ACTION: 1
};

const buttonStyles = {};
// TODO these colors come from what we are doing in theme.js for aframe mixins but they seem fishy
function applyTheme() {
    buttonStyles[BUTTON_TYPES.DEFAULT] = {
        color: new THREE.Color(0xffffff),
        hoverColor: new THREE.Color(0xaaaaaa),
        textColor: new THREE.Color("#6f6ec4"),
        textHoverColor: new THREE.Color("#7e81c6")
    };
    buttonStyles[BUTTON_TYPES.ACTION] = {
        color: new THREE.Color("#6f6ec4"),
        hoverColor: new THREE.Color("#7e81c6"),
        textColor: new THREE.Color(0xffffff),
        textHoverColor: new THREE.Color(0xffffff)
    };
}
applyTheme();

const hoverComponents = [HoveredRemoteRight, HoveredRemoteLeft, HoveredHandRight, HoveredHandLeft];

const hoverButtonsQuery = defineQuery([HoverButton]);
function hoverButtonSystem(world) {
    hoverButtonsQuery(world).forEach(function (eid) {
        const obj = world.eid2obj.get(eid);
        const isHovered = hasAnyComponent(world, hoverComponents, eid);
        const style = buttonStyles[HoverButton.type[eid]];
        obj.material.color.copy(isHovered ? style.hoverColor : style.color);
        if (hasComponent(world, TextButton, eid)) {
            const lbl = world.eid2obj.get(TextButton.labelRef[eid]);
            lbl.color = isHovered ? style.textHoverColor : style.textColor;
        }
    });
}

export function buttonSystems(world) {
    hoverButtonSystem(world);
    singleActionButtonSystem(world);
}
