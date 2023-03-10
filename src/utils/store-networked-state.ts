import { Networked } from "../bit-components";
import type { EntityID, Message } from "./networking-types";
import { HubsWorld } from "../app";
import HubChannel from "./hub-channel";
import { takeOwnership } from "./take-ownership";
import { localClientID } from "../bit-systems/networking";
import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "./phoenix-utils";

export interface StorableMessage extends Message {
    version: 1;
}
