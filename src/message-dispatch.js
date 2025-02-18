import "./utils/configs";
import { getAbsoluteHref } from "./utils/media-url-utils";
import { isValidSceneUrl } from "./utils/scene-url-utils";
// import { spawnChatMessage } from "./react-components/chat-message";
// import { SOUND_CHAT_MESSAGE, SOUND_QUACK, SOUND_SPECIAL_QUACK } from "./systems/sound-effects-system";
import ducky from "./assets/models/DuckyMesh.glb";
import { EventTarget } from "event-target-shim";
import { createNetworkedEntity } from "./utils/create-networked-entity";
import qsTruthy from "./utils/qs_truthy";

let uiRoot;
// Handles user-entered messages
export default class MessageDispatch extends EventTarget {
    constructor(scene, entryManager, hubChannel, remountUI, mediaSearchStore) {
        super();
        this.scene = scene;
        this.entryManager = entryManager;
        this.hubChannel = hubChannel;
        this.remountUI = remountUI;
        this.mediaSearchStore = mediaSearchStore;
        this.presenceLogEntries = [];
    }

    addToPresenceLog(entry) {
        entry.key = Date.now().toString();

        const lastEntry =
            this.presenceLogEntries.length > 0 && this.presenceLogEntries[this.presenceLogEntries.length - 1];
        if (lastEntry && entry.type === "permission" && lastEntry.type === "permission") {
            if (
                lastEntry.body.permission === entry.body.permission &&
                parseInt(entry.key) - parseInt(lastEntry.key) < 10000
            ) {
                this.presenceLogEntries.pop();
            }
        }

        this.presenceLogEntries.push(entry);
        this.remountUI({ presenceLogEntries: this.presenceLogEntries });
        if (entry.type === "chat" && this.scene.is("loaded")) {
            // this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CHAT_MESSAGE);
        }

        // Fade out and then remove
        setTimeout(() => {
            entry.expired = true;
            this.remountUI({ presenceLogEntries: this.presenceLogEntries });

            setTimeout(() => {
                this.presenceLogEntries.splice(this.presenceLogEntries.indexOf(entry), 1);
                this.remountUI({ presenceLogEntries: this.presenceLogEntries });
            }, 1000);
        }, 20000);
    }

    receive(message) {
        if (message.type == "teleportRequest") {
            console.log("Teleport request received");
            if (NAF.clientId != message.sessionId) {
                let pos = message.body;
                // Scatter players around the person making request TODO: Make better
                pos.x = pos.x + Math.random() * (0.3 - 1) + 1;
                pos.z = pos.z + Math.random() * (0.3 - 1) + 1;
                this.scene.systems["hubs-systems"].characterController.teleportTo(pos);
            }
        }
        if (message.type == "muteRequest") {
            console.log("Mute request received");
            window.APP.mediaDevicesManager.stopMicShare();
        }
        if (message.type == "kickRequest") {
            window.APP.dialog.disconnect();
            NAF.connection.disconnect();
            window.APP.mediaDevicesManager.stopMicShare();
        }
        if (message.type == "unMuteRequest") {
            window.APP.mediaDevicesManager.startMicShare({});
        }

        this.addToPresenceLog(message);
        this.dispatchEvent(new CustomEvent("message", { detail: message }));
    }

    log = (messageType, props) => {
        this.receive({ type: "log", messageType, props });
    };

    dispatch = message => {
        if (message.startsWith("/")) {
            const commandParts = message.substring(1).split(/\s+/);
            this.dispatchCommand(commandParts[0], ...commandParts.slice(1));
            document.activeElement.blur(); // Commands should blur
        } else {
            this.hubChannel.sendMessage(message);
        }
    };

    dispatchCommand = async (command, ...args) => {
        const entered = this.scene.is("entered");
        uiRoot = uiRoot || document.getElementById("ui-root");
        const isGhost = !entered && uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");

        // TODO: Some of the commands below should be available without requiring room entry.
        if (!entered && (!isGhost || command === "duck")) {
            return;
        }

        const avatarRig = document.querySelector("#avatar-rig");
        const scales = [0.0625, 0.125, 0.25, 0.5, 1.0, 1.5, 3, 5, 7.5, 12.5];
        const curScale = avatarRig.object3D.scale;
        let err;
        let physicsSystem;
        const captureSystem = this.scene.systems["capture-system"];

        switch (command) {
            case "fly":
                if (this.scene.systems["hubs-systems"].characterController.fly) {
                    this.scene.systems["hubs-systems"].characterController.enableFly(false);
                }
                break;
            case "grow":
                for (let i = 0; i < scales.length; i++) {
                    if (scales[i] > curScale.x) {
                        avatarRig.object3D.scale.set(scales[i], scales[i], scales[i]);
                        avatarRig.object3D.matrixNeedsUpdate = true;
                        break;
                    }
                }

                break;
            case "shrink":
                for (let i = scales.length - 1; i >= 0; i--) {
                    if (curScale.x > scales[i]) {
                        avatarRig.object3D.scale.set(scales[i], scales[i], scales[i]);
                        avatarRig.object3D.matrixNeedsUpdate = true;
                        break;
                    }
                }

                break;
            case "leave":
                this.entryManager.exitScene();
                this.remountUI({ roomUnavailableReason: "Left" });
                break;

            case "oldduck":
                // spawnChatMessage(getAbsoluteHref(location.href, ducky));
                if (Math.random() < 0.01) {
                    // this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
                } else {
                    // this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
                }
                break;
            case "duck":
                if (qsTruthy("newLoader")) {
                    const avatarPov = document.querySelector("#avatar-pov-node").object3D;
                    const eid = createNetworkedEntity(APP.world, "media", {
                        src: getAbsoluteHref(location.href, ducky),
                        resize: true,
                        recenter: true,
                        animateLoad: true,
                        isObjectMenuTarget: true
                    });
                    const obj = APP.world.eid2obj.get(eid);
                    obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
                    obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));
                } else {
                    // spawnChatMessage(getAbsoluteHref(location.href, ducky));
                }
                if (Math.random() < 0.01) {
                    // this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
                } else {
                    // this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
                }
                break;
            case "cube": {
                const avatarPov = document.querySelector("#avatar-pov-node").object3D;
                const eid = createNetworkedEntity(APP.world, "cube");
                const obj = APP.world.eid2obj.get(eid);
                obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
                obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));
                break;
            }
            case "debug":
                physicsSystem = document.querySelector("a-scene").systems["hubs-systems"].physicsSystem;
                physicsSystem.setDebug(!physicsSystem.debugEnabled);
                break;
            case "vrstats":
                document.getElementById("stats").components["stats-plus"].toggleVRStats();
                break;
            case "scene":
                if (args[0]) {
                    if (await isValidSceneUrl(args[0])) {
                        err = this.hubChannel.updateScene(args[0]);
                    }
                } else if (this.hubChannel.canOrWillIfCreator("update_hub")) {
                    this.mediaSearchStore.sourceNavigateWithNoNav("scenes", "use");
                }

                break;
            case "rename":
                err = this.hubChannel.rename(args.join(" "));
                break;
            case "capture":
                if (!captureSystem.available()) {
                    break;
                }
                if (args[0] === "stop") {
                    if (captureSystem.started()) {
                        captureSystem.stop();
                    }
                } else {
                    if (!captureSystem.started()) {
                        captureSystem.start();
                    }
                }
                break;
            case "audioNormalization":
                {
                    if (args.length === 1) {
                        const factor = Number(args[0]);
                        if (!isNaN(factor)) {
                            const effectiveFactor = Math.max(0.0, Math.min(255.0, factor));
                            window.APP.store.update({
                                preferences: { audioNormalization: effectiveFactor }
                            });
                        }
                    }
                }
                break;
        }
    };
}
