import { defineQuery } from "bitecs";
import { Networked } from "../bit-components";
import type { ClientID, CreateMessageData, EntityID, Message, StringID } from "../utils/networking-types";
export let localClientID: ClientID | null = null;
export function setLocalClientID(clientID: ClientID) {
    localClientID = clientID;
}
export const createMessageDatas: Map<EntityID, CreateMessageData> = new Map();
export const networkedQuery = defineQuery([Networked]);
export const pendingMessages: Message[] = [];
export const pendingJoins: StringID[] = [];
export const pendingParts: StringID[] = [];
export const softRemovedEntities = new Set<EntityID>();
export function isNetworkInstantiated(eid: EntityID) {
    return createMessageDatas.has(eid);
}

let reticulum: StringID | undefined;
export function isPinned(eid: EntityID) {
    reticulum = reticulum || APP.getSid("reticulum");
    return Networked.creator[eid] === reticulum;
}

export function isCreatedByMe(eid: EntityID) {
    return Networked.creator[eid] === APP.getSid(NAF.clientId);
}

export function isOwnedByMe(eid: EntityID) {
    return Networked.owner[eid] === APP.getSid(NAF.clientId);
}
