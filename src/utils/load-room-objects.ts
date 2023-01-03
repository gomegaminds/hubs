import { localClientID, pendingMessages } from "../bit-systems/networking";
import { messageForLegacyRoomObjects } from "./message-for";
import { NetworkID } from "./networking-types";
import { getReticulumFetchUrl } from "./phoenix-utils";
import { StorableMessage } from "./store-networked-state";

type LegacyRoomObject = any;
type StoredRoomDataNode = LegacyRoomObject | StorableMessage;

type StoredRoomData = {
    asset: {
        version: "2.0";
        generator: "megaminds";
    };
    scenes: [{ nodes: number[]; name: "Room Objects" }];
    nodes: StoredRoomDataNode[];
    extensionsUsed: ["HUBS_components"];
};

export function isStorableMessage(node: any): node is StorableMessage {
    const result = !!(node.version && node.creates && node.updates && node.deletes);
    return result;
}

async function fetchStoredRoomMessages(hubId: string) {
    const objectsUrl = "http://localhost:8000/api/inside/" + hubId + "/objects.gltf";
    const response = await fetch(objectsUrl);
    const roomData: StoredRoomData = await response.json();
    const messages: StorableMessage[] = roomData.nodes.filter(node => isStorableMessage(node));
    return messages;
}

export async function loadStoredRoomData(hubId: string) {
    const messages = await fetchStoredRoomMessages(hubId);
    console.log(messages);
    if (hubId === APP.hub!.hub_id) {
        if (!localClientID) {
            throw new Error("Cannot apply stored messages without a local client ID");
        }
        console.log("Got following from server that are valid messages", messages);
        messages.forEach(m => {
            m.fromClientId = "reticulum";
            m.hubId = hubId;
            m.updates.forEach(update => {
                update.owner = "reticulum";
            });
            pendingMessages.push(m);
        });
    }
}

export async function loadLegacyRoomObjects(hubId: string) {
    console.log("loading legacy room objects...");
    const objectsUrl = "http://localhost:8000/api/inside/" + hubId + "/objects.gltf";
    const response = await fetch(objectsUrl);
    const roomData: StoredRoomData = await response.json();
    const legacyRoomObjects: LegacyRoomObject[] = roomData.nodes.filter(node => !isStorableMessage(node));

    if (hubId === APP.hub!.hub_id) {
        const message = messageForLegacyRoomObjects(legacyRoomObjects);
        if (message) {
            message.fromClientId = "reticulum";
            message.hubId = hubId;

            pendingMessages.push(message);
            // TODO All clients must use the new loading path for this to work correctly,
            // because all clients must agree on which netcode to use (hubs networking
            // systems or networked aframe) for a given object.
        }
        console.log({ legacyRoomObjects, message });
    }
}

type StoredMessageList = {
    data: StoredMessage[];
};
type StoredMessage = {
    version: number;
    blob: string;
    entity_id: NetworkID;
    hub_id: string;
};

async function fetchEntityMessages(hubId: string) {
    const objectsUrl = "http://localhost:8000/api/inside/" + hubId + "/objects.gltf";
    const response = await fetch(objectsUrl);
    const roomData: StoredMessageList = await response.json();
    console.log(roomData);
    const messages: StorableMessage[] = roomData.data
        .filter(message => message.version === 1)
        .map(message => {
            return JSON.parse(message.blob);
        })
        .filter(blob => isStorableMessage(blob));
    return messages;
}

export async function loadEntityMessages(hubId: string) {
    const messages = await fetchEntityMessages(hubId);
    if (hubId === APP.hub!.hub_id) {
        if (!localClientID) {
            throw new Error("Cannot apply stored messages without a local client ID");
        }
        console.log("got messages", messages);
        messages.forEach(m => {
            m.fromClientId = "reticulum";
            m.hubId = hubId; // TODO: This should be returned with the message
            m.updates.forEach(update => {
                update.owner = "reticulum";
            });
            pendingMessages.push(m);
        });
    }
}
