import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { createMessageDatas } from "../bit-systems/networking";
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
    StorableUpdateMessage
} from "./networking-types";

const hasOwnerInfoChanged = (() => {
    const serialize = defineNetworkSchemaForProps([Networked.lastOwnerTime, Networked.owner]).serialize;
    const data: CursorBuffer = [];
    return function hasOwnerInfoChanged(world: HubsWorld, eid: EntityID, isFullSync: boolean, isBroadcast: boolean) {
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
        message.creates.push({
            version: 1,
            networkId: APP.getString(Networked.id[eid])!,
            prefabName,
            initialData
        });
    });

    updated.forEach(eid => {
        const updateMessage: CursorBufferUpdateMessage = {
            nid: APP.getString(Networked.id[eid])!,
            lastOwnerTime: Networked.lastOwnerTime[eid],
            timestamp: Networked.timestamp[eid],
            owner: APP.getString(Networked.owner[eid])!,
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

        if (hasOwnerInfoChanged(world, eid, isFullSync, isBroadcast) || updateMessage.componentIds.length) {
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

