import jwtDecode from "jwt-decode";
import { EventTarget } from "event-target-shim";
import { Presence } from "phoenix";
import { migrateChannelToSocket, discordBridgesForPresences, migrateToChannel } from "./phoenix-utils";
import configs from "./configs";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

function isSameMonth(da, db) {
    return da.getFullYear() == db.getFullYear() && da.getMonth() == db.getMonth();
}

function isSameDay(da, db) {
    return isSameMonth(da, db) && da.getDate() == db.getDate();
}

// Permissions that will be assumed if the user becomes the creator.
const HUB_CREATOR_PERMISSIONS = [
    "update_hub",
    "update_hub_promotion",
    "update_roles",
    "close_hub",
    "mute_users",
    "kick_users",
    "amplify_audio"
];

const VALID_PERMISSIONS = HUB_CREATOR_PERMISSIONS.concat([
    "tweet",
    "spawn_camera",
    "spawn_drawing",
    "spawn_stickynote",
    "spawn_and_move_media",
    "pin_objects",
    "spawn_emoji",
    "fly"
]);

export default class HubChannel extends EventTarget {
    constructor(store, hubId) {
        super();
        this.store = store;
        this.hubId = hubId;
        this._blockedSessionIds = new Set();

        store.addEventListener("profilechanged", this.sendProfileUpdate.bind(this));
    }

    canEnterRoom(hub) {
        if (!hub) return false;

        const roomEntrySlotCount = Object.values(this.presence.state).reduce((acc, { metas }) => {
            const meta = metas[metas.length - 1];
            const usingSlot = meta.presence === "room" || (meta.context && meta.context.entering);
            return acc + (usingSlot ? 1 : 0);
        }, 0);

        // This now exists in room settings but a default is left here to support old reticulum servers
        const DEFAULT_ROOM_SIZE = 24;
        return roomEntrySlotCount < (hub.room_size !== undefined ? hub.room_size : DEFAULT_ROOM_SIZE);
    }

    // Migrates this hub channel to a new phoenix channel and presence
    async migrateToSocket(socket, params) {
        let presenceBindings;

        // Unbind presence, and then set up bindings after reconnect
        if (this.presence) {
            presenceBindings = {
                onJoin: this.presence.caller.onJoin,
                onLeave: this.presence.caller.onLeave,
                onSync: this.presence.caller.onSync
            };

            this.presence.onJoin(function () {});
            this.presence.onLeave(function () {});
            this.presence.onSync(function () {});
        }

        this.channel = await migrateChannelToSocket(this.channel, socket, params);
        this.presence = new Presence(this.channel);

        if (presenceBindings) {
            this.presence.onJoin(presenceBindings.onJoin);
            this.presence.onLeave(presenceBindings.onLeave);
            this.presence.onSync(presenceBindings.onSync);
        }
    }

    async migrateToHub(hubId) {
        let presenceBindings;

        const newChannel = this.channel.socket.channel(`hub:${hubId}`, APP.hubChannelParamsForPermsToken());
        const data = await migrateToChannel(this.channel, newChannel);

        if (this.presence) {
            presenceBindings = {
                onJoin: this.presence.caller.onJoin,
                onLeave: this.presence.caller.onLeave,
                onSync: this.presence.caller.onSync
            };

            this.presence.onJoin(function () {});
            this.presence.onLeave(function () {});
            this.presence.onSync(function () {});
        }

        this.channel = newChannel;
        this.presence = new Presence(this.channel);
        this.hubId = data.hubs[0].hub_id;

        if (presenceBindings) {
            this.presence.onJoin(presenceBindings.onJoin);
            this.presence.onLeave(presenceBindings.onLeave);
            this.presence.onSync(presenceBindings.onSync);
        }
        return data;
    }

    setPermissionsFromToken = token => {
        // Note: token is not verified.
        this.token = token;
        this._permissions = jwtDecode(token);
        configs.setIsAdmin(this._permissions.postgrest_role === "ret_admin");
        this.dispatchEvent(new CustomEvent("permissions_updated"));

        // Refresh the token 1 minute before it expires.
        const nextRefresh = new Date(this._permissions.exp * 1000 - 60 * 1000) - new Date();
        if (this.fetchPermissionsTimeout) {
            clearTimeout(this.fetchPermissionsTimeout);
        }
        this.fetchPermissionsTimeout = setTimeout(this.fetchPermissions, nextRefresh);
    };

    sendEnteringEvent = async () => {
        this.channel.push("events:entering", {});
    };

    sendEnteringCancelledEvent = async () => {
        this.channel.push("events:entering_cancelled", {});
    };

    sendEnteredEvent = async () => {
        if (!this.channel) {
            console.warn("No phoenix channel initialized before room entry.");
            return;
        }

        let entryDisplayType = "Screen";

        if (navigator.getVRDisplays) {
            const vrDisplay = (await navigator.getVRDisplays()).find(d => d.isPresenting);

            if (vrDisplay) {
                entryDisplayType = vrDisplay.displayName;
            }
        }

        const initialOccupantCount = this.presence
            .list((key, presence) => {
                return { key, entryState: presence.metas[presence.metas.length - 1].presence };
            })
            .filter(({ key, entryState }) => {
                return key !== NAF.clientId && entryState === "room";
            }).length;

        const entryTimingFlags = this.getEntryTimingFlags();

        const entryEvent = {
            ...entryTimingFlags,
            initialOccupantCount,
            entryDisplayType,
            userAgent: navigator.userAgent
        };

        this.channel.push("events:entered", entryEvent);
    };

    raiseHand() {
        this.channel.push("events:raise_hand", {});
    }

    lowerHand() {
        this.channel.push("events:lower_hand", {});
    }

    getEntryTimingFlags = () => {
        const entryTimingFlags = { isNewDaily: true, isNewMonthly: true, isNewDayWindow: true, isNewMonthWindow: true };
        const storedLastEnteredAt = this.store.state.activity.lastEnteredAt;

        if (!storedLastEnteredAt) {
            return entryTimingFlags;
        }

        const now = new Date();
        const lastEntered = new Date(storedLastEnteredAt);
        const msSinceLastEntered = now - lastEntered;

        // note that new daily and new monthly is based on client local time
        entryTimingFlags.isNewDaily = !isSameDay(now, lastEntered);
        entryTimingFlags.isNewMonthly = !isSameMonth(now, lastEntered);
        entryTimingFlags.isNewDayWindow = msSinceLastEntered > MS_PER_DAY;
        entryTimingFlags.isNewMonthWindow = msSinceLastEntered > MS_PER_MONTH;

        return entryTimingFlags;
    };

    sendObjectSpawnedEvent = objectType => {
        if (!this.channel) {
            console.warn("No phoenix channel initialized before object spawn.");
            return;
        }

        const spawnEvent = {
            object_type: objectType
        };

        this.channel.push("events:object_spawned", spawnEvent);
    };

    sendProfileUpdate = () => {
        this.channel.push("events:profile_updated", { profile: this.store.state.profile });
    };

    updateScene = url => {
        // if (!this._permissions.update_hub) return "unauthorized";
        this.channel.push("update_scene", { url });
    };

    // If true, will tell the server to not send us any NAF traffic
    allowNAFTraffic = allow => {
        this.channel.push(allow ? "unblock_naf" : "block_naf", {});
    };

    sendMuteRequest = () => {
        console.log("Sendmuterequest triggered");
        let body = "asd";
        let type = "muteRequest";
        this.channel.push("message", { body, type });
    };

    sendUnMuteRequest = () => {
        console.log("SendUnMuterequest triggered");
        let body = "asd";
        let type = "unMuteRequest";
        this.channel.push("message", { body, type });
    };

    sendTeleportRequest = (body, type = "teleportRequest") => {
        if (!this._permissions.kick_users) return "unauthorized";
        console.log("Teleport request received");
        if (!body) return;
        this.channel.push("message", { body, type });
    };

    getHost = () => {
        return new Promise((resolve, reject) => {
            this.channel
                .push("get_host")
                .receive("ok", res => {
                    resolve(res);
                })
                .receive("error", reject);
        });
    };

    mute = sessionId => this.channel.push("mute", { session_id: sessionId });
    addOwner = sessionId => this.channel.push("add_owner", { session_id: sessionId });
    removeOwner = sessionId => this.channel.push("remove_owner", { session_id: sessionId });

    hide = sessionId => {
        NAF.connection.adapter.block(sessionId);
        APP.dialog.block(sessionId);
        this.channel.push("block", { session_id: sessionId });
        this._blockedSessionIds.add(sessionId);
    };

    unhide = sessionId => {
        if (!this._blockedSessionIds.has(sessionId)) return;
        NAF.connection.adapter.unblock(sessionId);
        APP.dialog.unblock(sessionId);
        NAF.connection.entities.completeSync(sessionId);
        this.channel.push("unblock", { session_id: sessionId });
        this._blockedSessionIds.delete(sessionId);
    };

    isHidden = sessionId => this._blockedSessionIds.has(sessionId);

    kick = async sessionId => {
        APP.dialog.kick(sessionId);
        this.channel.push("kick", { session_id: sessionId });
    };

    disconnect = () => {
        if (this.channel) {
            this.channel.socket.disconnect();
        }
    };
}
