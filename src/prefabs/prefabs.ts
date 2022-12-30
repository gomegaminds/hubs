import { MediaLoaderParams } from "../inflators/media-loader";
import { ParticleEmitterParams } from "../inflators/reaction";
import { CameraPrefab, CubeMediaFramePrefab } from "./camera-tool";
import { MediaPrefab } from "./media";
import { ReactionPrefab } from "./reaction";
import { EntityDef } from "../utils/jsx-entity";

type CameraPrefabT = () => EntityDef;
type CubeMediaPrefabT = () => EntityDef;
type MediaPrefabT = (params: MediaLoaderParams) => EntityDef;
type ReactionPrefabT = (params: ParticleEmitterParams) => EntityDef;

export type PrefabDefinition = {
    permission?: "spawn_camera";
    template: CameraPrefabT | CubeMediaPrefabT | MediaPrefabT | ReactionPrefabT;
};

export type PrefabName = "camera" | "cube" | "media" | "reaction";

export const prefabs = new Map<PrefabName, PrefabDefinition>();

prefabs.set("camera", { permission: "spawn_camera", template: CameraPrefab });
prefabs.set("cube", { template: CubeMediaFramePrefab });
prefabs.set("media", { template: MediaPrefab });
prefabs.set("reaction", { template: ReactionPrefab });
