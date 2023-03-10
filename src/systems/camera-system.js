import { waitForDOMContentLoaded } from "../utils/async-utils";
import { addComponent, removeComponent, addEntity } from "bitecs";
import { SpinningAnimation } from "../bit-components";
import { childMatch, setMatrixWorld, calculateViewingDistance } from "../utils/three-utils";
import { paths } from "./userinput/paths";
import { getBoxForObject3D } from "../utils/auto-box-collider";
import qsTruthy from "../utils/qs_truthy";
import { isTagged } from "../components/tags";
import { qsGet } from "../utils/qs_truthy";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { addObject3DComponent, renderAsEntity } from "../utils/jsx-entity";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
const customFOV = qsGet("fov");
const enableThirdPersonMode = qsTruthy("thirdPerson");
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { Layers } from "../components/layers";

import { defineQuery } from "bitecs";
import {
    Held,
    Holdable,
    HeldRemoteLeft,
    HeldRemoteRight,
    HoveredRemoteLeft,
    HoveredRemoteRight
} from "../bit-components";

const queryHeld = defineQuery([HoveredRemoteRight]);
const queryHeldLeft = defineQuery([HoveredRemoteRight]);

function getInspectableInHierarchy(el) {
    let inspectable = el;
    while (inspectable) {
        if (isTagged(inspectable, "inspectable")) {
            return inspectable.object3D;
        }
        inspectable = inspectable.parentNode;
    }
    console.warn("could not find inspectable in hierarchy");
    return el.object3D;
}

function pivotFor(el) {
    const selector =
        el.components["inspect-pivot-child-selector"] && el.components["inspect-pivot-child-selector"].data.selector;
    if (!selector) {
        return el.object3D;
    }

    const child = el.querySelector(selector);
    if (!child) {
        console.error(`Failed to find pivot for selector: ${selector}`, el);
        return el.object3D;
    }
    return child.object3D;
}

export function getInspectableAndPivot(el) {
    const inspectable = getInspectableInHierarchy(el);
    const pivot = pivotFor(inspectable.el);
    return { inspectable, pivot };
}

const decompose = (function () {
    const scale = new THREE.Vector3();
    return function decompose(m, p, q) {
        m.decompose(p, q, scale); //ignore scale, like we're dealing with a motor
    };
})();

const IDENTITY = new THREE.Matrix4().identity();
const orbit = (function () {
    const owq = new THREE.Quaternion();
    const owp = new THREE.Vector3();
    const cwq = new THREE.Quaternion();
    const cwp = new THREE.Vector3();
    const rwq = new THREE.Quaternion();
    const UP = new THREE.Vector3();
    const RIGHT = new THREE.Vector3();
    const dPos = new THREE.Vector3();
    const targetPos = new THREE.Vector3();
    const targetQuat = new THREE.Quaternion();
    const targetScale = new THREE.Vector3(1, 1, 1);
    const targetMatrix = new THREE.Matrix4();
    const dhQ = new THREE.Quaternion();
    const dvQ = new THREE.Quaternion();
    return function orbit(pivot, rig, camera, dh, dv, dz, dt, panY) {
        pivot.updateMatrices();
        decompose(pivot.matrixWorld, owp, owq);

        camera.updateMatrices();
        decompose(camera.matrixWorld, cwp, cwq);

        rig.getWorldQuaternion(rwq);

        dhQ.setFromAxisAngle(UP.set(0, 1, 0).applyQuaternion(owq), 0.1 * dh * dt);
        targetQuat.copy(cwq).premultiply(dhQ);
        dPos.subVectors(cwp, owp);
        const zoom = 1 - dz * dt;
        const newLength = dPos.length() * zoom;
        // TODO: These limits should be calculated based on the calculated view distance.
        if (newLength > 0.1 && newLength < 100) {
            dPos.multiplyScalar(zoom);
        }

        dvQ.setFromAxisAngle(RIGHT.set(1, 0, 0).applyQuaternion(targetQuat), 0.1 * dv * dt);
        targetQuat.premultiply(dvQ);
        targetPos.addVectors(owp, dPos.applyQuaternion(dhQ).applyQuaternion(dvQ)).add(
            UP.set(0, 1, 0)
                .multiplyScalar(panY * newLength)
                .applyQuaternion(targetQuat)
        );

        targetMatrix.compose(targetPos, targetQuat, targetScale);

        childMatch(rig, camera, targetMatrix);
    };
})();

const moveRigSoCameraLooksAtPivot = (function () {
    const owq = new THREE.Quaternion();
    const owp = new THREE.Vector3();
    const cwq = new THREE.Quaternion();
    const cwp = new THREE.Vector3();
    const oForw = new THREE.Vector3();
    const center = new THREE.Vector3();
    const defaultBoxMax = new THREE.Vector3(0.3, 0.3, 0.3);
    const target = new THREE.Object3D();
    return function moveRigSoCameraLooksAtPivot(rig, camera, inspectable, pivot, distanceMod) {
        if (!target.parent) {
            // add dummy object to the scene, if this is the first time we call this function
            AFRAME.scenes[0].object3D.add(target);
            target.applyMatrix4(IDENTITY); // make sure target gets updated at least once for our matrix optimizations
        }

        pivot.updateMatrices();
        decompose(pivot.matrixWorld, owp, owq);
        decompose(camera.matrixWorld, cwp, cwq);
        rig.getWorldQuaternion(cwq);

        const box = getBoxForObject3D(inspectable.parent, inspectable);

        if (box.min.x === Infinity) {
            // fix edgecase where inspectable object has no mesh / dimensions
            box.min.subVectors(owp, defaultBoxMax);
            box.max.addVectors(owp, defaultBoxMax);
        }
        box.getCenter(center);
        const vrMode = false;
        const dist =
            calculateViewingDistance(80, window.APP.scene.sceneEl.camera.aspect, box, center, vrMode) * distanceMod;
        target.position.addVectors(
            owp,
            oForw
                .set(0, 0, 1) //TODO: Suspicious that this is called oForw but (0,0,1) is backwards
                .multiplyScalar(dist)
                .applyQuaternion(owq)
        );
        target.quaternion.copy(owq);
        target.matrixNeedsUpdate = true;
        target.updateMatrices();
        childMatch(rig, camera, target.matrixWorld);
    };
})();

export const CAMERA_MODE_FIRST_PERSON = 0;
export const CAMERA_MODE_THIRD_PERSON_NEAR = 1;
export const CAMERA_MODE_THIRD_PERSON_FAR = 2;
export const CAMERA_MODE_INSPECT = 3;
export const CAMERA_MODE_SCENE_PREVIEW = 4;
export const CAMERA_MODE_WORLDBUILDING = 5;

const NEXT_MODES = {
    [CAMERA_MODE_FIRST_PERSON]: CAMERA_MODE_THIRD_PERSON_NEAR,
    [CAMERA_MODE_THIRD_PERSON_NEAR]: CAMERA_MODE_THIRD_PERSON_FAR,
    [CAMERA_MODE_THIRD_PERSON_FAR]: CAMERA_MODE_WORLDBUILDING,
    [CAMERA_MODE_WORLDBUILDING]: CAMERA_MODE_FIRST_PERSON
};

const ensureLightsAreSeenByCamera = function (o) {
    if (o.isLight) {
        o.layers.enable(Layers.CAMERA_LAYER_INSPECT);
    }
};

const firstPersonOnlyLayer = new THREE.Layers();
firstPersonOnlyLayer.set(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);
const enableInspectLayer = function (o) {
    // Ignore first person only meshes
    if (o.layers.test(firstPersonOnlyLayer)) return;
    o.layers.enable(Layers.CAMERA_LAYER_INSPECT);
};
const disableInspectLayer = function (o) {
    // Ignore first person only meshes
    if (o.layers.test(firstPersonOnlyLayer)) return;
    o.layers.disable(Layers.CAMERA_LAYER_INSPECT);
};

function getAudio(o) {
    let audio;
    o.traverse(c => {
        if (!audio && c.type === "Audio") {
            audio = c;
        }
    });
    return audio;
}

const FALLOFF = 0.9;
export class CameraSystem {
    constructor(camera, renderer) {
        this.viewingCamera = camera;
        this.worldBuildingControls = undefined;
        this.lightsEnabled = true;
        this.helper = null;
        this.verticalDelta = 0;
        this.horizontalDelta = 0;
        this.inspectZoom = 0;
        this.isInsideMenu = null;
        this.mode = CAMERA_MODE_SCENE_PREVIEW;
        this.snapshot = { audioTransform: new THREE.Matrix4(), matrixWorld: new THREE.Matrix4() };
        this.audioSourceTargetTransform = new THREE.Matrix4();

        if (customFOV) {
            this.viewingCamera.fov = customFOV;
        }
        this.viewingCamera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
        this.viewingCamera.layers.enable(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);
        this.viewingCamera.layers.enable(Layers.CAMERA_LAYER_UI);

        waitForDOMContentLoaded().then(() => {
            this.scene = AFRAME.scenes[0];
            this.avatarPOV = document.getElementById("avatar-pov-node");
            this.avatarRig = document.getElementById("avatar-rig");
            this.viewingRig = document.getElementById("viewing-rig");

            const bg = new THREE.Mesh(
                new THREE.BoxGeometry(100, 100, 100),
                new THREE.MeshBasicMaterial({ color: 0x020202, side: THREE.BackSide })
            );
            bg.layers.set(Layers.CAMERA_LAYER_INSPECT);
            this.viewingRig.object3D.add(bg);

            // this.scene.object3D.add(this.helper);

            // this.transformControls = new TransformControls(this.viewingCamera, this.scene.renderer.domElement);
            // this.transformControls.name = "TransformControls";
            // this.scene.object3D.add(this.transformControls);

            // const eid = addComponent(window.APP.world);
            // addObject3DComponent(window.APP.world, eid, this.transformControls);

            // console.log(eid);
        });
    }

    inspect(el, distanceMod, fireChangeEvent = true) {
        this.uninspect();
        // const { inspectable, pivot } = getInspectableAndPivot(el);
        // Inspectable is an object3d
        // Pivor is also object3d if no child elements
        const inspectable = el;
        const pivot = el;

        this.scene.classList.add("hand-cursor");
        this.scene.classList.remove("no-cursor");

        this.verticalDelta = 0;
        this.horizontalDelta = 0;
        this.inspectZoom = 0;
        if (this.mode === CAMERA_MODE_INSPECT) {
            return;
        }
        this.scene.object3D.traverse(ensureLightsAreSeenByCamera);
        this.snapshot.mode = this.mode;
        this.mode = CAMERA_MODE_INSPECT;
        this.inspectable = inspectable;
        this.pivot = pivot;

        this.snapshot.mask = this.scene.camera.layers.mask;
        this.scene.camera.layers.disable(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);
        this.scene.camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);

        this.viewingCamera.updateMatrices();
        this.snapshot.matrixWorld.copy(this.viewingRig.object3D.matrixWorld);

        this.snapshot.audio = getAudio(inspectable);

        if (this.snapshot.audio) {
            this.snapshot.audio.updateMatrices();
            this.snapshot.audioTransform.copy(this.snapshot.audio.matrixWorld);
            this.scene.audioListener.updateMatrices();
            this.audioSourceTargetTransform
                .makeTranslation(0, 0, -0.25)
                .premultiply(this.scene.audioListener.matrixWorld);
            setMatrixWorld(this.snapshot.audio, this.audioSourceTargetTransform);
        }

        this.ensureListenerIsParentedCorrectly(this.scene);

        moveRigSoCameraLooksAtPivot(
            this.viewingRig.object3D,
            this.viewingCamera,
            this.inspectable,
            this.pivot,
            distanceMod || 1
        );
    }

    uninspect(fireChangeEvent = true) {
        if (this.scene.is("entered")) {
            this.scene.classList.remove("hand-cursor");
            this.scene.classList.add("no-cursor");
        }
        if (this.mode !== CAMERA_MODE_INSPECT) return;
        this.scene.camera.layers.mask = this.snapshot.mask;
        this.inspectable = null;
        this.pivot = null;
        if (this.snapshot.audio) {
            setMatrixWorld(this.snapshot.audio, this.snapshot.audioTransform);
            this.snapshot.audio = null;
        }

        this.mode = this.snapshot.mode;
        if (this.snapshot.mode === CAMERA_MODE_SCENE_PREVIEW) {
            setMatrixWorld(this.viewingRig.object3D, this.snapshot.matrixWorld);
        }
        this.snapshot.mode = null;
        this.tick(this.scene);
        this.scene.emit("right_menu_changed", null);
    }

    ensureListenerIsParentedCorrectly(scene) {
        if (this.scene.audioListener && this.avatarPOV) {
            if (this.mode === CAMERA_MODE_INSPECT && this.scene.audioListener.parent !== this.avatarPOV.object3D) {
                this.avatarPOV.object3D.add(this.scene.audioListener);
            } else if (
                (this.mode === CAMERA_MODE_FIRST_PERSON ||
                    this.mode === CAMERA_MODE_THIRD_PERSON_NEAR ||
                    this.mode === CAMERA_MODE_THIRD_PERSON_FAR) &&
                this.scene.audioListener.parent !== this.viewingCamera
            ) {
                this.viewingCamera.add(this.scene.audioListener);
            }
        }
    }

    tick = (function () {
        const translation = new THREE.Matrix4();
        let uiRoot;
        return function tick(scene, dt) {
            const entered = scene.is("entered");
            if (!entered) {
                return;
            }

            uiRoot = uiRoot || document.getElementById("ui-root");

            if (!this.enteredScene && entered) {
                this.enteredScene = true;
                this.mode = CAMERA_MODE_FIRST_PERSON;
            }

            this.viewingCamera.matrixNeedsUpdate = true;
            this.viewingCamera.updateMatrix();
            this.viewingCamera.updateMatrixWorld();

            this.avatarPOVRotator = this.avatarPOVRotator || this.avatarPOV.components["pitch-yaw-rotator"];
            this.viewingCameraRotator =
                this.viewingCameraRotator || this.viewingCamera.el.components["pitch-yaw-rotator"];
            this.avatarPOVRotator.on = true;
            this.viewingCameraRotator.on = true;

            this.userinput = this.userinput || scene.systems.userinput;
            this.interaction = this.interaction || scene.systems.interaction;

            if (this.userinput.get(paths.actions.stopInspecting)) {
                this.uninspect();
            }

            if (this.helper) {
                this.helper.update();
            }

            // if (this.transformControls.object) {
            //  this.transformControls.updateMatrix();
            //}

            if (
                this.userinput.get(paths.actions.startInspecting) ||
                this.userinput.get(paths.actions.cursor.right.click)
            ) {
                const hoverEl = queryHeldLeft(APP.world)[0];

                if (hoverEl) {
                    const hoverObj = APP.world.eid2obj.get(hoverEl);

                    if (hoverObj.el?.components["avatar-inspect-collider"]) {
                        if (window.APP.objectHelper.can("kick_user")) {
                            const playerInfo = hoverObj.el.closest("#playerInfoElement").components["player-info"];
                            scene.emit("right_menu_changed", {
                                variant: "user_settings",
                                payload: { id: playerInfo.playerSessionId }
                            });
                        }
                    } else {
                        if (this.helper === null) {
                            this.helper = new THREE.BoxHelper(hoverObj, 0xffff00);
                            this.scene.object3D.add(this.helper);
                        }
                        // console.log(this.transformControls);

                        // If we are starting edit of what we are already editing, close the menu
                        if (hoverEl === this.isInsideMenu) {
                            if (this.helper) {
                                this.helper.visible = false;
                            }
                            scene.emit("right_menu_changed", null);
                            this.isInsideMenu = null;
                        } else if (hoverEl) {
                            // Reset if moving directly from one to the next
                            this.helper.setFromObject(hoverObj, 0xffff00);
                            this.helper.visible = true;

                            scene.emit("right_menu_changed", hoverEl);
                            this.isInsideMenu = hoverEl;
                        }
                    }
                }
            }

            /*else if (this.mode === CAMERA_MODE_INSPECT && this.userinput.get(paths.actions.stopInspecting)) {
                scene.emit("uninspect");
                this.uninspect();
            }
            */

            this.ensureListenerIsParentedCorrectly(scene);

            if (this.mode === CAMERA_MODE_FIRST_PERSON) {
                this.viewingCameraRotator.on = false;
                this.avatarRig.object3D.updateMatrices();
                setMatrixWorld(this.viewingRig.object3D, this.avatarRig.object3D.matrixWorld);
                if (scene.is("vr-mode")) {
                    this.viewingCamera.updateMatrices();
                    setMatrixWorld(this.avatarPOV.object3D, this.viewingCamera.matrixWorld);
                } else {
                    this.avatarPOV.object3D.updateMatrices();
                    setMatrixWorld(this.viewingCamera, this.avatarPOV.object3D.matrixWorld);
                }
            } else if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR || this.mode === CAMERA_MODE_THIRD_PERSON_FAR) {
                if (this.mode === CAMERA_MODE_THIRD_PERSON_NEAR) {
                    translation.makeTranslation(0, 1, 3);
                } else {
                    translation.makeTranslation(0, 2, 8);
                }
                this.avatarRig.object3D.updateMatrices();
                this.viewingRig.object3D.matrixWorld.copy(this.avatarRig.object3D.matrixWorld).multiply(translation);
                setMatrixWorld(this.viewingRig.object3D, this.viewingRig.object3D.matrixWorld);
                this.avatarPOV.object3D.quaternion.copy(this.viewingCamera.quaternion);
                this.avatarPOV.object3D.matrixNeedsUpdate = true;
            } else if (this.mode === CAMERA_MODE_INSPECT) {
                this.avatarPOVRotator.on = false;
                this.viewingCameraRotator.on = false;
                const cameraDelta = this.userinput.get(
                    scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta
                );

                if (cameraDelta) {
                    // TODO: Move device specific tinkering to action sets
                    const horizontalDelta = (AFRAME.utils.device.isMobile() ? -0.6 : 1) * cameraDelta[0] || 0;
                    const verticalDelta = (AFRAME.utils.device.isMobile() ? -1.2 : 1) * cameraDelta[1] || 0;
                    this.horizontalDelta = (this.horizontalDelta + horizontalDelta) / 2;
                    this.verticalDelta = (this.verticalDelta + verticalDelta) / 2;
                } else if (Math.abs(this.verticalDelta) > 0.0001 || Math.abs(this.horizontalDelta) > 0.0001) {
                    this.verticalDelta = FALLOFF * this.verticalDelta;
                    this.horizontalDelta = FALLOFF * this.horizontalDelta;
                }

                const inspectZoom = this.userinput.get(paths.actions.inspectZoom) * 0.001;
                if (inspectZoom) {
                    this.inspectZoom = inspectZoom + (5 * this.inspectZoom) / 6;
                } else if (Math.abs(this.inspectZoom) > 0.0001) {
                    this.inspectZoom = FALLOFF * this.inspectZoom;
                }
                const panY = this.userinput.get(paths.actions.inspectPanY) || 0;
                if (this.userinput.get(paths.actions.resetInspectView)) {
                    moveRigSoCameraLooksAtPivot(
                        this.viewingRig.object3D,
                        this.viewingCamera,
                        this.inspectable,
                        this.pivot,
                        1
                    );
                }
                if (this.snapshot.audio) {
                    setMatrixWorld(this.snapshot.audio, this.audioSourceTargetTransform);
                }

                if (
                    Math.abs(this.verticalDelta) > 0.001 ||
                    Math.abs(this.horizontalDelta) > 0.001 ||
                    Math.abs(this.inspectZoom) > 0.001 ||
                    Math.abs(panY) > 0.0001
                ) {
                    orbit(
                        this.pivot,
                        this.viewingRig.object3D,
                        this.viewingCamera,
                        this.horizontalDelta,
                        this.verticalDelta,
                        this.inspectZoom,
                        dt,
                        panY
                    );
                }
            }
        };
    })();
}
