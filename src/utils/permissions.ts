import { PrefabName, prefabs } from "../prefabs/prefabs";
import type { ClientID } from "./networking-types";

export function hasPermissionToSpawn(creator: ClientID, prefabName: PrefabName) {
    // We dont use the hubs code here as we have our own permission backend
    return true;
}
