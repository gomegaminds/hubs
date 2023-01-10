import { NetworkedAudio } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const runtimeSerde = defineNetworkSchema(NetworkedAudio);

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
    if (version !== 1) return false;

    const { time, flags }: { time: number; flags: number } = data;
    write(NetworkedAudio.time, eid, time);
    write(NetworkedAudio.flags, eid, flags);
    return true;
}

export const NetworkedAudioSchema: NetworkSchema = {
    componentName: "networked-audio",
    serialize: runtimeSerde.serialize,
    deserialize: runtimeSerde.deserialize,
    serializeForStorage: function serializeForStorage(eid: EntityID) {
        return {
            version: 1,
            data: {
                time: read(NetworkedAudio.time, eid),
                flags: read(NetworkedAudio.flags, eid)
            }
        };
    },
    deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
