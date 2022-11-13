import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

import { getCurrentHubId, updateSceneCopresentState, createHubChannelParams } from "./utils/hub-utils";
import configs from "./utils/configs";
import "core-js/stable";
import "regenerator-runtime/runtime";
import "bootstrap/dist/css/bootstrap.min.css";

import ReactGA from "react-ga4";

if (process.env.NODE_ENV !== "development") {
    Sentry.init({
        dsn: "https://376450af079e417bbe24e8dfc73736c8@o4503923994656768.ingest.sentry.io/4503924045185025",
        integrations: [new BrowserTracing()],

        release: "0.1",
        environment: "prod",
        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 1.0
    });
} else {
    console.log("Development environment found. Skipping sentry initialization");
}

import "./mega-src/react-components/styles/global.css";
import loadingEnvironment from "./assets/models/LoadingEnvironment.glb";

import "aframe";
import "./utils/aframe-overrides";

import * as THREE from "three";
THREE.Cache.enabled = false;
THREE.Object3D.DefaultMatrixAutoUpdate = false;

import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "networked-aframe/src/index";
import "webrtc-adapter";
import { detectOS, detect } from "detect-browser";
import {
    getReticulumFetchUrl,
    getReticulumMeta,
    migrateChannelToSocket,
    connectToReticulum,
    denoisePresence,
    presenceEventsForHub,
    tryGetMatchingMeta
} from "./utils/phoenix-utils";
import { Presence } from "phoenix";
import { emitter } from "./emitter";
import "./phoenix-adapter";

import nextTick from "./utils/next-tick";
import { addAnimationComponents } from "./utils/animation";
import { DialogAdapter, DIALOG_CONNECTION_ERROR_FATAL, DIALOG_CONNECTION_CONNECTED } from "./naf-dialog-adapter";
import "./change-hub";

import "./hub-components";

import ReactDOM from "react-dom";
import React from "react";
import { Router, Route } from "react-router-dom";
import { createBrowserHistory, createMemoryHistory } from "history";
import { pushHistoryState } from "./utils/history";
import Root from "./mega-src/react-components/Root";
import AuthChannel from "./utils/auth-channel";
import HubChannel from "./utils/hub-channel";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { proxiedUrlFor } from "./utils/media-url-utils";
import { traverseMeshesAndAddShapes } from "./utils/physics-utils";
import { getAvatarSrc } from "./utils/avatar-utils.js";
import MessageDispatch from "./message-dispatch";
import SceneEntryManager from "./scene-entry-manager";
import { createInWorldLogMessage } from "./react-components/chat-message";

import "./systems/nav";
import "./systems/frame-scheduler";
import "./systems/personal-space-bubble";
import "./systems/permissions";
import "./systems/exit-on-blur";
import "./systems/auto-pixel-ratio";
import "./systems/pen-tools";
import "./systems/userinput/userinput";
import "./systems/userinput/userinput-debug";
import "./systems/ui-hotkeys";
import "./systems/interactions";
import "./systems/hubs-systems";
import "./systems/listed-media";
import "./systems/linked-media";
import "./systems/audio-debug-system";
import "./systems/audio-gain-system";

import "./gltf-component-mappings";

import { App } from "./app";
import MediaDevicesManager from "./utils/media-devices-manager";
import PinningHelper from "./utils/pinning-helper";
import { platformUnsupported } from "./support";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { renderAsEntity } from "./utils/jsx-entity";
import { VideoMenuPrefab } from "./prefabs/video-menu";

window.APP = new App();
renderAsEntity(APP.world, VideoMenuPrefab());
renderAsEntity(APP.world, VideoMenuPrefab());

const store = window.APP.store;
store.update({ preferences: { shouldPromptForRefresh: false } }); // Clear flag that prompts for refresh from preference screen

const NOISY_OCCUPANT_COUNT = 30; // Above this # of occupants, we stop posting join/leaves/renames

const qs = new URLSearchParams(location.search);
const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const isEmbed = window.self !== window.top;
if (isEmbed && !qs.get("embed_token")) {
    // Should be covered by X-Frame-Options, but just in case.
    throw new Error("no embed token");
}

import registerNetworkSchemas from "./network-schemas";

import { getAvailableVREntryTypes, VR_DEVICE_AVAILABILITY, ONLY_SCREEN_AVAILABLE } from "./utils/vr-caps-detect";
import detectConcurrentLoad from "./utils/concurrent-load-detector";

import qsTruthy from "./utils/qs_truthy";
import { ExitReason } from "./mega-src/react-components/misc/messages";
import { SignInMessages } from "./mega-src/react-components/misc/messages";
import { LogMessageType } from "./mega-src/react-components/misc/messages";
import "./load-media-on-paste-or-drop";

const PHOENIX_RELIABLE_NAF = "phx-reliable";
NAF.options.firstSyncSource = PHOENIX_RELIABLE_NAF;
NAF.options.syncSource = PHOENIX_RELIABLE_NAF;

const isDebug = qsTruthy("debug");

disableiOSZoom();
detectConcurrentLoad();

function setupLobbyCamera() {
    // console.log("Setting up lobby camera");
    const camera = document.getElementById("scene-preview-node");
    const previewCamera = document.getElementById("environment-scene").object3D.getObjectByName("scene-preview-camera");

    if (previewCamera) {
        camera.object3D.position.copy(previewCamera.position);
        camera.object3D.rotation.copy(previewCamera.rotation);
        camera.object3D.rotation.reorder("YXZ");
    } else {
        const cameraPos = camera.object3D.position;
        camera.object3D.position.set(cameraPos.x, 2.5, cameraPos.z);
    }

    camera.object3D.matrixNeedsUpdate = true;

    camera.removeAttribute("scene-preview-camera");
    camera.setAttribute("scene-preview-camera", "positionOnly: true; duration: 60");
}

let uiProps = {};

// Hub ID and slug are the basename
let routerBaseName = document.location.pathname.split("/").slice(0, 2).join("/");

if (document.location.pathname.includes("hub.html")) {
    routerBaseName = "/";
}

function mountUI(props = {}) {
    const scene = document.querySelector("a-scene");

    ReactDOM.render(
        <Auth0Provider
            domain="megaminds-prod.us.auth0.com"
            clientId="4VYsoMjINRZrBjnjvFLyn5utkQT9YRnM"
            redirectUri={window.location.origin}
            audience="https://api.megaminds.world"
            scope="openid profile email read:classrooms read:teacher_profile create:submission"
            useRefreshTokens
            cacheLocation="localstorage"
        >
            <Root
                {...{
                    scene,
                    store,
                    ...props
                }}
            />
        </Auth0Provider>,
        document.getElementById("Root")
    );
}

export function remountUI(props) {
    uiProps = { ...uiProps, ...props };
    mountUI(uiProps);
}

export async function getSceneUrlForHub(hub) {
    let sceneUrl;
    if (hub.scene) {
        sceneUrl = hub.scene.model_url;
    } else {
        sceneUrl = loadingEnvironment;
    }

    return sceneUrl;
}

export async function updateEnvironmentForHub(hub, entryManager) {
    // console.log("Updating environment for hub");
    const sceneUrl = await getSceneUrlForHub(hub);

    const sceneErrorHandler = () => {
        remountUI({ roomUnavailableReason: ExitReason.sceneError });
        entryManager.exitScene();
    };

    const environmentScene = document.querySelector("#environment-scene");
    const sceneEl = document.querySelector("a-scene");

    const envSystem = sceneEl.systems["hubs-systems"].environmentSystem;

    // console.log(`Scene URL: ${sceneUrl}`);
    const loadStart = performance.now();

    let environmentEl = null;

    if (environmentScene.childNodes.length === 0) {
        const environmentEl = document.createElement("a-entity");

        environmentEl.addEventListener(
            "model-loaded",
            () => {
                environmentEl.removeEventListener("model-error", sceneErrorHandler);

                // console.log(`Scene file initial load took ${Math.round(performance.now() - loadStart)}ms`);

                // Show the canvas once the model has loaded
                document.querySelector(".a-canvas").classList.remove("a-hidden");

                sceneEl.addState("visible");

                envSystem.updateEnvironment(environmentEl);

                //TODO: check if the environment was made with spoke to determine if a shape should be added
                traverseMeshesAndAddShapes(environmentEl);
            },
            { once: true }
        );

        environmentEl.addEventListener("model-error", sceneErrorHandler, { once: true });

        environmentEl.setAttribute("gltf-model-plus", { src: sceneUrl, useCache: false, inflate: true });
        environmentScene.appendChild(environmentEl);
    } else {
        // Change environment
        environmentEl = environmentScene.childNodes[0];

        // Clear the three.js image cache and load the loading environment before switching to the new one.
        THREE.Cache.clear();
        const waypointSystem = sceneEl.systems["hubs-systems"].waypointSystem;
        waypointSystem.releaseAnyOccupiedWaypoints();

        environmentEl.addEventListener(
            "model-loaded",
            () => {
                environmentEl.addEventListener(
                    "model-loaded",
                    () => {
                        environmentEl.removeEventListener("model-error", sceneErrorHandler);

                        envSystem.updateEnvironment(environmentEl);

                        // console.log(`Scene file update load took ${Math.round(performance.now() - loadStart)}ms`);

                        traverseMeshesAndAddShapes(environmentEl);

                        // We've already entered, so move to new spawn point once new environment is loaded
                        if (sceneEl.is("entered")) {
                            waypointSystem.moveToSpawnPoint();
                        }

                        const fader = document.getElementById("viewing-camera").components["fader"];

                        // Add a slight delay before de-in to reduce hitching.
                        setTimeout(() => fader.fadeIn(), 2000);
                    },
                    { once: true }
                );

                sceneEl.emit("leaving_loading_environment");
                if (environmentEl.components["gltf-model-plus"].data.src === sceneUrl) {
                    console.warn("Updating environment to the same url.");
                    environmentEl.setAttribute("gltf-model-plus", { src: "" });
                }
                environmentEl.setAttribute("gltf-model-plus", { src: sceneUrl });
            },
            { once: true }
        );

        if (!sceneEl.is("entered")) {
            environmentEl.addEventListener("model-error", sceneErrorHandler, { once: true });
        }

        if (environmentEl.components["gltf-model-plus"].data.src === loadingEnvironment) {
            console.warn("Transitioning to loading environment but was already in loading environment.");
            environmentEl.setAttribute("gltf-model-plus", { src: "" });
        }
        environmentEl.setAttribute("gltf-model-plus", { src: loadingEnvironment });
    }
}

export async function updateUIForHub(hub, hubChannel) {
    remountUI({ hub, entryDisallowed: !hubChannel.canEnterRoom(hub) });
}

function onConnectionError(entryManager, connectError) {
    console.error("An error occurred while attempting to connect to networked scene:", connectError);
    // hacky until we get return codes
    const isFull = connectError.msg && connectError.msg.match(/\bfull\b/i);
    remountUI({ roomUnavailableReason: isFull ? ExitReason.full : ExitReason.connectError });
    entryManager.exitScene();
}

const events = emitter();
function handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data) {
    const scene = document.querySelector("a-scene");
    const isRejoin = NAF.connection.isConnected();

    if (isRejoin) {
        // Slight hack, to ensure correct presence state we need to re-send the entry event
        // on re-join. Ideally this would be updated into the channel socket state but this
        // would require significant changes to the hub channel events and socket management.
        if (scene.is("entered")) {
            hubChannel.sendEnteredEvent();
        }

        // Send complete sync on phoenix re-join.
        // TODO: We should be able to safely remove this completeSync now that
        //       NAF occupancy is driven from phoenix presence state.
        NAF.connection.entities.completeSync(null, true);
        return;
    }

    // Turn off NAF for embeds as an optimization, so the user's browser isn't getting slammed
    // with NAF traffic on load.
    if (isEmbed) {
        hubChannel.allowNAFTraffic(false);
    }

    const hub = data.hubs[0];

    console.log(`Dialog host: ${hub.host}:${hub.port}`);

    remountUI({
        messageDispatch: messageDispatch,
        onSendMessage: messageDispatch.dispatch,
        onLoaded: () => store.executeOnLoadActions(scene),
        onMediaSearchResultEntrySelected: (entry, selectAction) =>
            scene.emit("action_selected_media_result_entry", { entry, selectAction }),
        onMediaSearchCancelled: entry => scene.emit("action_media_search_cancelled", entry),
        onAvatarSaved: entry => scene.emit("action_avatar_saved", entry)
    });

    scene.addEventListener("action_selected_media_result_entry", e => {
        const { entry, selectAction } = e.detail;
        if ((entry.type !== "scene_listing" && entry.type !== "scene") || selectAction !== "use") return;
        if (!hubChannel.can("update_hub")) return;

        hubChannel.updateScene(entry.url);
    });

    scene.addEventListener(
        "didConnectToNetworkedScene",
        () => {
            // Append objects once we are in the NAF room since ownership may be taken.
            const objectsScene = document.querySelector("#objects-scene");
            const objectsUrl = getReticulumFetchUrl(`/${hub.hub_id}/objects.gltf`);
            const objectsEl = document.createElement("a-entity");

            objectsEl.setAttribute("gltf-model-plus", { src: objectsUrl, useCache: false, inflate: true });
            objectsScene.appendChild(objectsEl);
            console.log("Did connect, loading objects...", objectsEl);
        },
        { once: true }
    );

    scene.setAttribute("networked-scene", {
        room: hub.hub_id,
        serverURL: `wss://${hub.host}:${hub.port}`, // TODO: This is confusing because this is the dialog host and port.
        debug: !!isDebug,
        adapter: "phoenix"
    });

    (async () => {
        while (!scene.components["networked-scene"] || !scene.components["networked-scene"].data) await nextTick();

        window.APP.hub = hub;
        updateUIForHub(hub, hubChannel);
        scene.emit("hub_updated", { hub });
        updateEnvironmentForHub(hub, entryManager);

        // Disconnect in case this is a re-entry
        APP.dialog.disconnect();
        APP.dialog.connect({
            serverUrl: `wss://${hub.host}:${hub.port}`,
            roomId: hub.hub_id,
            serverParams: { host: hub.host, port: hub.port, turn: hub.turn },
            scene,
            clientId: data.session_id,
            forceTcp: qs.get("force_tcp"),
            forceTurn: qs.get("force_turn"),
            iceTransportPolicy: qs.get("force_tcp") || qs.get("force_turn") ? "relay" : "all"
        });
        scene.addEventListener(
            "adapter-ready",
            ({ detail: adapter }) => {
                adapter.hubChannel = hubChannel;
                adapter.events = events;
                adapter.session_id = data.session_id;
            },
            { once: true }
        );
        scene.components["networked-scene"]
            .connect()
            .then(() => {
                scene.emit("didConnectToNetworkedScene");
            })
            .catch(connectError => {
                onConnectionError(entryManager, connectError);
            });
    })();
}

function redirectToEntryFlow() {
    document.location = `/#/entry/?destination=${encodeURIComponent(document.location.toString())}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!store.state.profile?.displayName) {
        redirectToEntryFlow();
    }

    const canvas = document.querySelector(".a-canvas");
    canvas.classList.add("a-hidden");

    if (platformUnsupported()) {
        return;
    }

    const detectedOS = detectOS(navigator.userAgent);
    const browser = detect();

    if (["iOS", "Mac OS"].includes(detectedOS) && ["safari", "ios"].includes(browser.name)) {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            remountUI({ showSafariMicDialog: true });
            return;
        }
    }

    const hubId = getCurrentHubId();
    // console.log(`Hub ID: ${hubId}`);

    ReactGA.initialize("G-GCVLB2BSYP");
    ReactGA.send({ hitType: "pageview", page: hubId });

    const scene = document.querySelector("a-scene");
    window.APP.scene = scene;

    // If the stored avatar doesn't have a valid src, reset to a legacy avatar.
    const avatarSrc = await getAvatarSrc(store.state.profile.avatarId);
    if (!avatarSrc) {
        await store.resetToRandomDefaultAvatar();
    }

    const authChannel = new AuthChannel(store);
    const hubChannel = new HubChannel(store, hubId);
    window.APP.hubChannel = hubChannel;

    const entryManager = new SceneEntryManager(hubChannel, authChannel, history);
    window.APP.entryManager = entryManager;

    APP.dialog.on(DIALOG_CONNECTION_CONNECTED, () => {
        scene.emit("didConnectToDialog");
    });

    APP.dialog.on(DIALOG_CONNECTION_ERROR_FATAL, () => {
        // TODO: Change the wording of the connect error to match dialog connection error
        // TODO: Tell the user that dialog is broken, but don't completely end the experience
        remountUI({ roomUnavailableReason: ExitReason.connectError });
        APP.entryManager.exitScene();
    });

    const audioSystem = scene.systems["hubs-systems"].audioSystem;
    APP.mediaDevicesManager = new MediaDevicesManager(scene, store, audioSystem);

    window.APP.pinningHelper = new PinningHelper(hubChannel, authChannel, store);

    entryManager.init();

    window.dispatchEvent(new CustomEvent("hub_channel_ready"));

    registerNetworkSchemas();

    remountUI({
        authChannel,
        hubChannel,
        enterScene: entryManager.enterScene,
        exitScene: reason => {
            entryManager.exitScene();
            remountUI({ roomUnavailableReason: reason || ExitReason.exited });
        }
    });

    scene.addEventListener("leave_room_requested", () => {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: ExitReason.left });
    });

    scene.addEventListener("hub_closed", () => {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: ExitReason.closed });
    });

    getReticulumMeta().then(reticulumMeta => {
        // console.log(`Reticulum @ ${reticulumMeta.phx_host}: v${reticulumMeta.version} on ${reticulumMeta.pool}`);

        if (
            qs.get("required_ret_version") &&
            (qs.get("required_ret_version") !== reticulumMeta.version ||
                qs.get("required_ret_pool") !== reticulumMeta.pool)
        ) {
            remountUI({ roomUnavailableReason: ExitReason.versionMismatch });
            setTimeout(() => document.location.reload(), 5000);
            entryManager.exitScene();
            return;
        }
    });

    const environmentScene = document.querySelector("#environment-scene");

    environmentScene.addEventListener("model-loaded", ({ detail: { model } }) => {
        // console.log("Environment scene has loaded");

        if (!scene.is("entered")) {
            setupLobbyCamera();
        }

        // This will be run every time the environment is changed (including the first load.)
        remountUI({ environmentSceneLoaded: true });
        scene.emit("environment-scene-loaded", model);

        // Re-bind the teleporter controls collision meshes in case the scene changed.
        document
            .querySelectorAll("a-entity[teleporter]")
            .forEach(x => x.components["teleporter"].queryCollisionEntities());

        for (const modelEl of environmentScene.children) {
            addAnimationComponents(modelEl);
        }
    });

    // Socket disconnects on refresh but we don't want to show exit scene in that scenario.
    let isReloading = false;
    window.addEventListener("beforeunload", () => (isReloading = true));

    const socket = await connectToReticulum(isDebug);

    socket.onClose(e => {
        // We don't currently have an easy way to distinguish between being kicked (server closes socket)
        // and a variety of other network issues that seem to produce the 1000 closure code, but the
        // latter are probably more common. Either way, we just tell the user they got disconnected.
        const NORMAL_CLOSURE = 1000;

        if (e.code === NORMAL_CLOSURE && !isReloading) {
            entryManager.exitScene();
            remountUI({ roomUnavailableReason: ExitReason.disconnected });
        }
    });

    // Reticulum global channel
    APP.retChannel = socket.channel(`ret`, { hub_id: hubId });

    APP.hubChannelParamsForPermsToken = permsToken => {
        return createHubChannelParams({
            profile: store.state.profile,
            permsToken,
            isMobile,
            isMobileVR,
            isEmbed,
            hubInviteId: qs.get("hub_invite_id"),
            authToken: store.state.credentials && store.state.credentials.token
        });
    };

    const messageDispatch = new MessageDispatch(scene, entryManager, hubChannel, remountUI);
    APP.messageDispatch = messageDispatch;
    document.getElementById("avatar-rig").messageDispatch = messageDispatch;

    const hubPhxChannel = socket.channel(`hub:${hubId}`, APP.hubChannelParamsForPermsToken());
    hubChannel.channel = hubPhxChannel;
    hubChannel.presence = new Presence(hubPhxChannel);
    const { rawOnJoin, rawOnLeave } = denoisePresence(presenceEventsForHub(events));
    hubChannel.presence.onJoin(rawOnJoin);
    hubChannel.presence.onLeave(rawOnLeave);
    hubChannel.presence.onSync(() => {
        events.trigger(`hub:sync`, { presence: hubChannel.presence });
    });

    events.on(`hub:join`, ({ key, meta }) => {
        scene.emit("presence_updated", {
            sessionId: key,
            profile: meta.profile,
            roles: meta.roles,
            permissions: meta.permissions,
            streaming: meta.streaming,
            recording: meta.recording,
            hand_raised: meta.hand_raised,
            typing: meta.typing
        });
    });

    events.on(`hub:join`, ({ key, meta }) => {
        if (
            APP.hideHubPresenceEvents ||
            key === hubChannel.channel.socket.params().session_id ||
            hubChannel.presence.list().length > NOISY_OCCUPANT_COUNT
        ) {
            return;
        }
        messageDispatch.receive({
            type: "join",
            presence: meta.presence,
            name: meta.profile.displayName
        });
    });

    events.on(`hub:leave`, ({ meta }) => {
        if (APP.hideHubPresenceEvents || hubChannel.presence.list().length > NOISY_OCCUPANT_COUNT) {
            return;
        }
        messageDispatch.receive({
            type: "leave",
            name: meta.profile.displayName
        });
    });

    events.on(`hub:change`, ({ key, previous, current }) => {
        if (
            previous.presence === current.presence ||
            current.presence !== "room" ||
            key === hubChannel.channel.socket.params().session_id
        ) {
            return;
        }

        messageDispatch.receive({
            type: "entered",
            presence: current.presence,
            name: current.profile.displayName
        });
    });

    events.on(`hub:change`, ({ previous, current }) => {
        if (previous.profile.displayName !== current.profile.displayName) {
            messageDispatch.receive({
                type: "display_name_changed",
                oldName: previous.profile.displayName,
                newName: current.profile.displayName
            });
        }
    });

    events.on(`hub:change`, ({ key, previous, current }) => {
        if (
            key === hubChannel.channel.socket.params().session_id &&
            previous.profile.avatarId !== current.profile.avatarId
        ) {
            messageDispatch.log(LogMessageType.avatarChanged);
        }
    });

    events.on(`hub:change`, ({ key, current }) => {
        scene.emit("presence_updated", {
            sessionId: key,
            profile: current.profile,
            roles: current.roles,
            permissions: current.permissions,
            streaming: current.streaming,
            recording: current.recording,
            hand_raised: current.hand_raised,
            typing: current.typing
        });
    });

    // We need to be able to wait for initial presence syncs across reconnects and socket migrations,
    // so we create this object in the outer scope and assign it a new promise on channel join.
    //
    const presenceSync = {
        promise: null,
        resolve: null
    };

    events.on("hub:sync", () => {
        presenceSync.resolve();
    });

    events.on(`hub:sync`, () => {
        APP.hideHubPresenceEvents = false;
    });

    events.on(`hub:sync`, ({ presence }) => {
        updateSceneCopresentState(presence, scene);
    });

    events.on(`hub:sync`, ({ presence }) => {
        remountUI({
            sessionId: socket.params().session_id,
            presences: presence.state,
            entryDisallowed: !hubChannel.canEnterRoom(uiProps.hub)
        });
    });

    hubPhxChannel
        .join()
        .receive("ok", async data => {
            APP.hideHubPresenceEvents = true;
            presenceSync.promise = new Promise(resolve => {
                presenceSync.resolve = resolve;
            });

            socket.params().session_id = data.session_id;
            socket.params().session_token = data.session_token;

            const permsToken = data.perms_token;
            hubChannel.setPermissionsFromToken(permsToken);

            await presenceSync.promise;
            handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data, permsToken, hubChannel, events);
        })
        .receive("error", res => {
            if (res.reason === "closed") {
                entryManager.exitScene();
                remountUI({ roomUnavailableReason: ExitReason.closed });
            } else if (res.reason === "oauth_required") {
                entryManager.exitScene();
                remountUI({ oauthInfo: res.oauth_info, showOAuthScreen: true });
            } else if (res.reason === "join_denied") {
                entryManager.exitScene();
                remountUI({ roomUnavailableReason: ExitReason.denied });
            }

            console.error(res);
        });

    hubPhxChannel.on("message", ({ session_id, type, body, from }) => {
        const getAuthor = () => {
            const userInfo = hubChannel.presence.state[session_id];
            if (from) {
                return from;
            } else if (userInfo) {
                return userInfo.metas[0].profile.displayName;
            } else {
                return "Mystery user";
            }
        };

        const name = getAuthor();
        const maySpawn = scene.is("entered");

        const incomingMessage = {
            name,
            type,
            body,
            maySpawn,
            sessionId: session_id,
            sent: session_id === socket.params().session_id
        };

        if (scene.is("vr-mode")) {
            createInWorldLogMessage(incomingMessage);
        }

        messageDispatch.receive(incomingMessage);
    });

    hubPhxChannel.on("hub_refresh", ({ session_id, hubs, stale_fields }) => {
        const hub = hubs[0];
        const userInfo = hubChannel.presence.state[session_id];
        const displayName = (userInfo && userInfo.metas[0].profile.displayName) || "API";

        window.APP.hub = hub;
        updateUIForHub(hub, hubChannel);

        if (
            stale_fields.includes("scene") ||
            stale_fields.includes("scene_listing") ||
            stale_fields.includes("default_environment_gltf_bundle_url")
        ) {
            const fader = document.getElementById("viewing-camera").components["fader"];

            fader.fadeOut().then(() => {
                scene.emit("reset_scene");
                updateEnvironmentForHub(hub, entryManager);
            });

            messageDispatch.receive({
                type: "scene_changed",
                name: displayName,
                sceneName: hub.scene ? hub.scene.name : "a custom URL"
            });
        }

        if (stale_fields.includes("member_permissions")) {
            hubChannel.fetchPermissions();
        }

        if (stale_fields.includes("name")) {
            const titleParts = document.title.split(" | "); // Assumes title has | trailing site name
            titleParts[0] = hub.name;
            document.title = titleParts.join(" | ");

            // Re-write the slug in the browser history
            const pathParts = history.location.pathname.split("/");
            const oldSlug = pathParts[1];
            const { search, state } = history.location;
            const pathname = history.location.pathname.replace(`/${oldSlug}`, `/${hub.slug}`);

            history.replace({ pathname, search, state });

            messageDispatch.receive({
                type: "hub_name_changed",
                name: displayName,
                hubName: hub.name
            });
        }

        if (hub.entry_mode === "deny") {
            scene.emit("hub_closed");
        }

        scene.emit("hub_updated", { hub });
    });

    hubPhxChannel.on("permissions_updated", () => hubChannel.fetchPermissions());

    hubPhxChannel.on("mute", ({ session_id }) => {
        if (session_id === NAF.clientId) {
            APP.mediaDevicesManager.micEnabled = false;
        }
    });

    authChannel.setSocket(socket);
});
