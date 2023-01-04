import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas } from "../bit-systems/networking";
import { guessContentType } from "./media-url-utils";
import { MediaLoaderParams } from "../inflators/media-loader";
import { defineNetworkSchemaForProps } from "./define-network-schema";
import { networkableComponents, schemas } from "./network-schemas";
import type {
    CreateMessage,
    CursorBuffer,
    CursorBufferUpdateMessage,
    EntityID,
    Message,
    NetworkID,
    StorableUpdateMessage,
    UpdateMessage
} from "./networking-types";
import { StorableMessage } from "./store-networked-state";

const hasNetworkedComponentChanged = (() => {
    const serialize = defineNetworkSchemaForProps([
        Networked.lastOwnerTime,
        Networked.creator,
        Networked.owner
    ]).serialize;
    const data: CursorBuffer = [];
    return function hasNetworkedComponentChanged(
        world: HubsWorld,
        eid: EntityID,
        isFullSync: boolean,
        isBroadcast: boolean
    ) {
        const hasChanged = serialize(world, eid, data, isFullSync, isBroadcast);
        data.length = 0;
        return hasChanged;
    };
})();

export function messageFor(
    world: HubsWorld,
    created: EntityID[],
    updated: EntityID[],
    needsFullSyncUpdate: EntityID[],
    deleted: EntityID[],
    isBroadcast: boolean
) {
    const message: Message = {
        creates: [],
        updates: [],
        deletes: []
    };

    created.forEach(eid => {
        const { prefabName, initialData } = createMessageDatas.get(eid)!;
        message.creates.push([APP.getString(Networked.id[eid])!, prefabName, initialData]);
    });

    updated.forEach(eid => {
        const updateMessage: CursorBufferUpdateMessage = {
            nid: APP.getString(Networked.id[eid])!,
            lastOwnerTime: Networked.lastOwnerTime[eid],
            timestamp: Networked.timestamp[eid],
            owner: APP.getString(Networked.owner[eid])!,
            creator: APP.getString(Networked.creator[eid])!,
            componentIds: [],
            data: []
        };
        const isFullSync = needsFullSyncUpdate.includes(eid);

        for (let j = 0; j < networkableComponents.length; j++) {
            const component = networkableComponents[j];
            if (hasComponent(world, component, eid)) {
                if (schemas.get(component)!.serialize(world, eid, updateMessage.data, isFullSync, isBroadcast)) {
                    updateMessage.componentIds.push(j);
                }
            }
        }

        if (hasNetworkedComponentChanged(world, eid, isFullSync, isBroadcast) || updateMessage.componentIds.length) {
            message.updates.push(updateMessage);
        }
    });

    deleted.forEach(eid => {
        // TODO: We are reading component data of a deleted entity here.
        const nid = Networked.id[eid];
        message.deletes.push(APP.getString(nid)!);
    });

    if (message.creates.length || message.updates.length || message.deletes.length) {
        return message;
    }

    return null;
}

export function messageForStorage(world: HubsWorld, created: EntityID[], updated: EntityID[], deleted: EntityID[]) {
    const message: StorableMessage = {
        version: 1,
        creates: [],
        updates: [],
        deletes: []
    };

    created.forEach(eid => {
        console.log("getting for eid", eid, createMessageDatas);
        const { prefabName, initialData } = createMessageDatas.get(eid)!;
        message.creates.push([APP.getString(Networked.id[eid])!, prefabName, initialData]);
    });

    updated.forEach(eid => {
        const updateMessage: StorableUpdateMessage = {
            nid: APP.getString(Networked.id[eid])!,
            lastOwnerTime: Networked.lastOwnerTime[eid],
            timestamp: Networked.timestamp[eid],
            owner: APP.getString(Networked.owner[eid])!,
            creator: APP.getString(Networked.creator[eid])!,
            data: {}
        };

        for (let j = 0; j < networkableComponents.length; j++) {
            const component = networkableComponents[j];
            if (hasComponent(world, component, eid)) {
                const schema = schemas.get(component)!;
                updateMessage.data[schema.componentName] = schema.serializeForStorage(eid);
            }
        }

        message.updates.push(updateMessage);
    });

    deleted.forEach(eid => {
        // TODO: We are reading component data of a deleted entity here.
        const nid = Networked.id[eid];
        message.deletes.push(APP.getString(nid)!);
    });

    console.log("Created final message to be sent", message);
    // This is all good, the update message is contained here.

    if (message.creates.length || message.updates.length || message.deletes.length) {
        return message;
    }

    return null;
}

export interface LegacyRoomObject {
    extensions: {
        HUBS_components: {
            media: {
                version: number;
                src: string;
                id: NetworkID;
                contentSubtype?: string;
            };
            text?: any;
            question?: any;
            pinnable: {
                pinned: boolean;
            };
        };
    };
    name: NetworkID;
    rotation: [number, number, number, number];
    translation: [number, number, number];
    scale: [number, number, number];
}

export function messageForLegacyRoomObjectsList(objects: LegacyRoomObject[]) {
    const message: any = {
        objects: []
    };

    objects.forEach(obj => {
        const initialData: any = {
            src: obj.extensions.HUBS_components.media.src,
            originalPos: obj.translation,
            originalRot: obj.rotation,
            originalScale: obj.scale,
            contentType: guessContentType(obj.extensions.HUBS_components.media.src),
            textComponent: obj.extensions.HUBS_components.text ? obj.extensions.HUBS_components.text : null,
            questionComponent: obj.extensions.HUBS_components.question ? obj.extensions.HUBS_components.question : null
        };
        // Skip text and such
        message.objects.push(initialData);
    });

    if (message.objects.length) {
        return message;
    }
    return null;
}

export function messageForLegacyRoomObjects(objects: LegacyRoomObject[]) {
    const message: Message = {
        creates: [],
        updates: [],
        deletes: []
    };

    objects.forEach(obj => {
        const nid = obj.name;
        const initialData: MediaLoaderParams = {
            src: obj.extensions.HUBS_components.media.src,
            resize: false,
            recenter: false,
            animateLoad: false,
            isObjectMenuTarget: true
        };
        const createMessage: CreateMessage = [nid, "media", initialData];
        message.creates.push(createMessage);

        console.log("Trying to load legacy obj", obj);
        const updateMessage: StorableUpdateMessage = {
            data: {
                "networked-transform": {
                    version: 1,
                    data: {
                        position: [Math.random(), 1, Math.random()],
                        rotation: obj.rotation,
                        scale: [0.3, 0.3, 0.3]
                    }
                }
            },
            nid,
            lastOwnerTime: 0,
            timestamp: 0,
            owner: "reticulum",
            creator: "reticulum"
        };
        message.updates.push(updateMessage);
    });

    if (message.creates.length || message.updates.length) {
        return message;
    }
    return null;
}
