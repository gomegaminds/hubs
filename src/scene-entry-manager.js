import qsTruthy from "./utils/qs_truthy";
import nextTick from "./utils/next-tick";
import { hackyMobileSafariTest } from "./utils/detect-touchscreen";
import { SignInMessages } from "./mega-src/react-components/misc/messages";
import { createNetworkedEntity } from "./systems/netcode";

const isMobile = AFRAME.utils.device.isMobile();
const forceEnableTouchscreen = hackyMobileSafariTest();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const isDebug = qsTruthy("debug");
const qs = new URLSearchParams(location.search);

import { addMedia } from "./utils/media-utils";
import { ObjectContentOrigins } from "./object-types";
import { getAvatarSrc, getAvatarType } from "./utils/avatar-utils";
import { SOUND_ENTER_SCENE } from "./systems/sound-effects-system";
import { MediaDevices, MediaDevicesEvents } from "./utils/media-devices-utils";
import { addComponent, removeEntity } from "bitecs";
import { MyCameraTool } from "./bit-components";
import { anyEntityWith } from "./utils/bit-utils";

export default class SceneEntryManager {
    constructor(hubChannel, authChannel, history) {
        this.hubChannel = hubChannel;
        this.authChannel = authChannel;
        this.store = window.APP.store;
        this.scene = document.querySelector("a-scene");
        this.rightCursorController = document.getElementById("right-cursor-controller");
        this.leftCursorController = document.getElementById("left-cursor-controller");
        this.avatarRig = document.getElementById("avatar-rig");
        this._entered = false;
        this.performConditionalSignIn = () => {};
        this.history = history;
    }

    init = () => {
        this.whenSceneLoaded(() => {
            this.rightCursorController.components["cursor-controller"].enabled = false;
            this.leftCursorController.components["cursor-controller"].enabled = false;
            this.mediaDevicesManager = APP.mediaDevicesManager;
            this._setupBlocking();
        });

        this.scene.addEventListener("leave_room_requested", () => {
            entryManager.exitScene();
        });

        this.scene.addEventListener("hub_closed", () => {
            entryManager.exitScene();
        });
    };

    hasEntered = () => {
        return this._entered;
    };

    enterScene = async (enterInVR, muteOnEntry) => {
        document.getElementById("viewing-camera").removeAttribute("scene-preview-camera");

        if (isDebug && NAF.connection.adapter.session) {
            NAF.connection.adapter.session.options.verbose = true;
        }

        const waypointSystem = this.scene.systems["hubs-systems"].waypointSystem;
        waypointSystem.moveToSpawnPoint();

        if (isMobile || forceEnableTouchscreen || qsTruthy("force_enable_touchscreen")) {
            this.avatarRig.setAttribute("virtual-gamepad-controls", {});
        }

        this._setupPlayerRig();
        this._setupKicking();
        this._setupMedia();
        this._setupCamera();
        this._spawnAvatar();

        this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_ENTER_SCENE);

        this.scene.classList.remove("hand-cursor");
        this.scene.classList.add("no-cursor");

        this.rightCursorController.components["cursor-controller"].enabled = true;
        this.leftCursorController.components["cursor-controller"].enabled = true;
        this._entered = true;

        // Delay sending entry event telemetry until VR display is presenting.
        (async () => {
            while (enterInVR && !this.scene.renderer.xr.isPresenting) {
                await nextTick();
            }

            this.hubChannel.sendEnteredEvent().then(() => {
                this.store.update({ activity: { lastEnteredAt: new Date().toISOString() } });
            });
        })();

        // Bump stored entry count after 30s
        setTimeout(() => this.store.bumpEntryCount(), 30000);

        this.scene.addState("entered");

        APP.mediaDevicesManager.micEnabled = !muteOnEntry;
    };

    whenSceneLoaded = callback => {
        if (this.scene.hasLoaded) {
            console.log("Scene already loaded so callback invoked directly");
            callback();
        } else {
            console.log("Scene not yet loaded so callback is deferred");
            this.scene.addEventListener("loaded", callback);
        }
    };

    enterSceneWhenLoaded = (enterInVR, muteOnEntry) => {
        this.whenSceneLoaded(() => this.enterScene(enterInVR, muteOnEntry));
    };

    exitScene = () => {
        this.scene.exitVR();
        if (APP.dialog && APP.dialog.localMediaStream) {
            APP.dialog.localMediaStream.getTracks().forEach(t => t.stop());
        }
        if (this.hubChannel) {
            this.hubChannel.disconnect();
        }
        if (this.scene.renderer) {
            this.scene.renderer.setAnimationLoop(null); // Stop animation loop, TODO A-Frame should do this
        }
        this.scene.parentNode.removeChild(this.scene);
    };

    _setupPlayerRig = () => {
        this._setPlayerInfoFromProfile();

        // Explict user action changed avatar or updated existing avatar.
        this.scene.addEventListener("avatar_updated", () => this._setPlayerInfoFromProfile(true));

        // Store updates can occur to avatar id in cases like error, auth reset, etc.
        this.store.addEventListener("statechanged", () => this._setPlayerInfoFromProfile());

        const avatarScale = parseInt(qs.get("avatar_scale"), 10);
        if (avatarScale) {
            this.avatarRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
        }
    };

    _setPlayerInfoFromProfile = async (force = false) => {
        const avatarId = this.store.state.profile.avatarId;

        await fetch(`http://localhost:8000/api/avatars/${avatarId}`)
            .then(resp => resp.json())
            .then(data => {
                console.log(data, "from avatar api");
                if(data.glb.startsWith("/")) {
                    this.avatarRig.setAttribute("player-info", { avatarSrc: "http://localhost:8000" + data.glb });
                }  else {
                    this.avatarRig.setAttribute("player-info", { avatarSrc: data.glb });
                }
            });
    };

    _setupKicking = () => {
        // This event is only received by the kicker
        document.body.addEventListener("kicked", ({ detail }) => {
            const { clientId: kickedClientId } = detail;
            const { entities } = NAF.connection.entities;
            for (const id in entities) {
                const entity = entities[id];
                if (NAF.utils.getCreator(entity) !== kickedClientId) continue;

                if (entity.components.networked.data.persistent) {
                    NAF.utils.takeOwnership(entity);
                    window.APP.objectHelper.delete(entity);
                    entity.parentNode.removeChild(entity);
                } else {
                    NAF.entities.removeEntity(id);
                }
            }
        });
    };

    _setupBlocking = () => {
        document.body.addEventListener("blocked", ev => {
            NAF.connection.entities.removeEntitiesOfClient(ev.detail.clientId);
        });

        document.body.addEventListener("unblocked", ev => {
            NAF.connection.entities.completeSync(ev.detail.clientId, true);
        });
    };

    _setupMedia = () => {
        const offset = { x: 0, y: 0, z: -1.5 };
        const spawnMediaInfrontOfPlayer = (src, contentOrigin) => {
            if (!window.APP.objectHelper.can("can_create")) return;
            const { entity, orientation } = addMedia(
                src,
                "#interactable-media",
                contentOrigin,
                null,
                !(src instanceof MediaStream),
                true
            );

            orientation.then(or => {
                entity.setAttribute("offset-relative-to", {
                    target: "#avatar-pov-node",
                    offset,
                    orientation: or
                });
            });

            console.log("spawning entity", entity);

            entity.addEventListener("media_resolved", () => {
                window.APP.objectHelper.save(entity);
            });

            return entity;
        };

        this.scene.addEventListener("add_media", e => {
            const contentOrigin = e.detail instanceof File ? ObjectContentOrigins.FILE : ObjectContentOrigins.URL;

            spawnMediaInfrontOfPlayer(e.detail, contentOrigin);
        });

        this.scene.addEventListener("object_spawned", e => {
            this.hubChannel.sendObjectSpawnedEvent(e.detail.objectType);
        });

        this.scene.addEventListener("action_kick_client", ({ detail: { clientId } }) => {
            if (window.APP.objectHelper.can("kick_users")) {
                window.APP.hubChannel.kick(clientId);
            }
        });

        this.scene.addEventListener("action_mute_client", ({ detail: { clientId } }) => {
            if (window.APP.objectHelper.can("mute_users")) {
                window.APP.hubChannel.mute(clientId);
            }
        });

        if (!qsTruthy("newLoader")) {
            document.addEventListener("paste", e => {
                if (
                    (e.target.matches("input, textarea") || e.target.contentEditable === "true") &&
                    document.activeElement === e.target
                )
                    return;

                // Never paste into scene if dialog is open
                const uiRoot = document.querySelector(".ui-root");
                if (uiRoot && uiRoot.classList.contains("in-modal-or-overlay")) return;

                const url = e.clipboardData.getData("text");
                const files = e.clipboardData.files && e.clipboardData.files;
                if (url) {
                    spawnMediaInfrontOfPlayer(url, ObjectContentOrigins.URL);
                } else {
                    for (const file of files) {
                        spawnMediaInfrontOfPlayer(file, ObjectContentOrigins.CLIPBOARD);
                    }
                }
            });

            let lastDebugScene;
            document.addEventListener("drop", e => {
                e.preventDefault();

                if (qsTruthy("debugLocalScene")) {
                    URL.revokeObjectURL(lastDebugScene);
                    const url = URL.createObjectURL(e.dataTransfer.files[0]);
                    this.hubChannel.updateScene(url);
                    lastDebugScene = url;
                    return;
                }

                let url = e.dataTransfer.getData("url");

                if (!url) {
                    // Sometimes dataTransfer text contains a valid URL, so try for that.
                    try {
                        url = new URL(e.dataTransfer.getData("text")).href;
                    } catch (e) {
                        // Nope, not this time.
                    }
                }

                const files = e.dataTransfer.files;

                if (url) {
                    spawnMediaInfrontOfPlayer(url, ObjectContentOrigins.URL);
                } else {
                    for (const file of files) {
                        spawnMediaInfrontOfPlayer(file, ObjectContentOrigins.FILE);
                    }
                }
            });
        }

        document.addEventListener("dragover", e => e.preventDefault());

        let currentVideoShareEntity;
        let isHandlingVideoShare = false;

        const shareSuccess = (isDisplayMedia, isVideoTrackAdded, target) => {
            isHandlingVideoShare = false;

            if (isVideoTrackAdded) {
                if (target === "avatar") {
                    this.avatarRig.setAttribute("player-info", { isSharingAvatarCamera: true });
                } else {
                    currentVideoShareEntity = spawnMediaInfrontOfPlayer(
                        this.mediaDevicesManager.mediaStream,
                        undefined
                    );
                    // Wire up custom removal event which will stop the stream.
                    currentVideoShareEntity.setAttribute(
                        "emit-scene-event-on-remove",
                        `event:${MediaDevicesEvents.VIDEO_SHARE_ENDED}`
                    );
                }

                this.scene.emit("share_video_enabled", {
                    source: isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA
                });
                this.scene.addState("sharing_video");
            }
        };

        const shareError = error => {
            console.error(error);
            isHandlingVideoShare = false;
            this.scene.emit("share_video_failed");
        };

        this.scene.addEventListener("action_share_camera", event => {
            if (isHandlingVideoShare) return;
            isHandlingVideoShare = true;
            this.mediaDevicesManager.startVideoShare({
                isDisplayMedia: false,
                target: event.detail?.target,
                success: shareSuccess,
                error: shareError
            });
        });

        this.scene.addEventListener("action_share_screen", () => {
            if (isHandlingVideoShare) return;
            isHandlingVideoShare = true;
            this.mediaDevicesManager.startVideoShare({
                isDisplayMedia: true,
                target: null,
                success: shareSuccess,
                error: shareError
            });
        });

        this.scene.addEventListener(MediaDevicesEvents.VIDEO_SHARE_ENDED, async () => {
            if (isHandlingVideoShare) return;
            isHandlingVideoShare = true;

            if (currentVideoShareEntity && currentVideoShareEntity.parentNode) {
                NAF.utils.takeOwnership(currentVideoShareEntity);
                currentVideoShareEntity.parentNode.removeChild(currentVideoShareEntity);
            }

            await this.mediaDevicesManager.stopVideoShare();
            currentVideoShareEntity = null;

            this.avatarRig.setAttribute("player-info", { isSharingAvatarCamera: false });
            this.scene.emit("share_video_disabled");
            this.scene.removeState("sharing_video");
            isHandlingVideoShare = false;
        });

        this.scene.addEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, async () => {
            await this.mediaDevicesManager.stopMicShare();
        });
    };

    _setupCamera = () => {
        this.scene.addEventListener("action_toggle_camera", () => {
            const myCam = anyEntityWith(APP.world, MyCameraTool);
            if (myCam) {
                removeEntity(APP.world, myCam);
                this.scene.removeState("camera");
            } else {
                const avatarPov = document.querySelector("#avatar-pov-node").object3D;
                const eid = createNetworkedEntity(APP.world, "camera");
                addComponent(APP.world, MyCameraTool, eid);

                const obj = APP.world.eid2obj.get(eid);
                obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
                obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));

                this.scene.addState("camera");
            }
        });
    };

    _spawnAvatar = () => {
        this.avatarRig.setAttribute("networked", "template: #remote-avatar; attachTemplateToLocal: false;");
        this.avatarRig.setAttribute("networked-avatar", "");
        this.avatarRig.emit("entered");
    };
}
