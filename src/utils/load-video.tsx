/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { VideoTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";

export function* loadVideo(world: HubsWorld, url: string) {
    const { texture, ratio, live }: { texture: VideoTexture; ratio: number; live: boolean } = yield loadVideoTexture(url);

    console.log("Live", live);

    return renderAsEntity(
        world,
        <entity
            name="Video"
            grabbable={{ cursor: true, hand: false }}
            video={{
                texture,
                ratio,
                autoPlay: false,
                projection: ProjectionMode.FLAT,
                live: live
            }}
        ></entity>
    );
}
