/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { VideoTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { HubsWorld } from "../app";
import { AlphaMode } from "./create-image-mesh";
import { Texture } from "three";
import { audioTexture } from "./audio-texture";
import { loadTextureCancellable } from "./load-texture";
import { createVideoOrAudioEl } from "../utils/media-utils";

import errorImageSrc from "../assets/images/media-error.png";

export function* loadAudio(world: HubsWorld, url: string) {
    console.log("Loading audio from", url);

    if (window.APP?.scene?.audioListener) {
        // Create audio element
        const audioEl = document.createElement("audio");

        return renderAsEntity(
            world,
            <entity
                name="Audio"
                networked
                networkedAudio
                audio={{ url: url, autoPlay: false, audioEl: audioEl }}
                grabbable={{ cursor: true, hand: false }}
            ></entity>
        );
    } else {
        return renderAsEntity(
            world,
            <entity name="Audio" networked networkedAudio grabbable={{ cursor: true, hand: false }}></entity>
        );
    }
}
