import { Networked } from "../bit-components";
import type { EntityID, Message } from "./networking-types";
import { HubsWorld } from "../app";
import HubChannel from "./hub-channel";
import { takeOwnership } from "./take-ownership";
import { messageFor, messageForStorage } from "./message-for";
import { localClientID } from "../bit-systems/networking";
import { unpinMessages } from "../bit-systems/network-send-system";
import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "./phoenix-utils";

export interface StorableMessage extends Message {
    version: 1;
}

export async function tryPin(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
    if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
    takeOwnership(world, eid);
    Networked.creator[eid] = APP.getSid("reticulum");

    const nid = APP.getString(Networked.id[eid])!;

    const storableMessage = messageForStorage(world, [eid], [eid], []);
    const fileId = null;
    const fileAccessToken = null;
    const promotionToken = null;
    console.log("Pinning:", { nid, storableMessage });
    await hubChannel.pin(nid, storableMessage, fileId, fileAccessToken, promotionToken);
}

export async function tryUnpin(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
    if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
    takeOwnership(world, eid);
    Networked.creator[eid] = APP.getSid(localClientID!);
    const message = messageFor(world, [eid], [eid], [eid], [], false)!;
    unpinMessages.push(message);
    const fileId = null;
    console.log("this is where i would unpin...");
    hubChannel.unpin(APP.getString(Networked.id[eid])!, fileId);
}

export async function tryPin2(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
    if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
    takeOwnership(world, eid);
    Networked.creator[eid] = APP.getSid("reticulum");

    const nid = APP.getString(Networked.id[eid])!;
    const storableMessage = messageForStorage(world, [eid], [eid], []);
    const fileId = null;
    const fileAccessToken = null;
    const promotionToken = null;
    console.log("Pinning:", { nid, storableMessage });
    const payload = {
        message: {
            entity_id: nid,
            version: 1,
            blob: storableMessage
        },
        hub_id: APP.hub!.hub_id
    };
    console.log(payload);
    // await hubChannel.pin(nid, storableMessage, fileId, fileAccessToken, promotionToken);

    const response = await fetchReticulumAuthenticated(`/api/temp/messages/`, "POST", payload);
    console.log("pin reply:", response);
}

export async function tryUnpin2(world: HubsWorld, eid: EntityID, hubChannel: HubChannel) {
    if (!localClientID) throw new Error("Tried to unpin before connected to the channel...");
    takeOwnership(world, eid);
    Networked.creator[eid] = APP.getSid(localClientID!);
    const message = messageFor(world, [eid], [eid], [eid], [], false)!;
    unpinMessages.push(message);
    const fileId = null;
    const nid = APP.getString(Networked.id[eid])!;
    // hubChannel.unpin(nid, fileId);
    const payload = {
        entity_id: nid,
        hub_id: APP.hub!.hub_id
    };
    const response = await fetchReticulumAuthenticated(`/api/temp/messages/${nid}`, "DELETE", payload);
    console.log("pin reply:", response);
}
