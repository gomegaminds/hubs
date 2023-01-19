/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { VideoTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";

export function* loadVideo(world: HubsWorld, url: string) {
    const { texture, ratio }: { texture: VideoTexture; ratio: number } = yield loadVideoTexture(url);

    return renderAsEntity(
        world,
        <entity
            name="Video"
            video={{
                texture,
                ratio,
                autoPlay: false,
                projection: ProjectionMode.FLAT
            }}
        ></entity>
    );
}
