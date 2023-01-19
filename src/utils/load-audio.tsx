/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
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
import { Button3D, BUTTON_TYPES } from "../prefabs/button3D";

import errorImageSrc from "../assets/images/media-error.png";

export function* loadAudio(world: HubsWorld, url: string) {
    const playRef = createRef();
    const pauseRef = createRef();
    const stopRef = createRef();

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
            >
                <Button3D
                    ref={playRef}
                    type={0}
                    scale={[0.4, 0.4, 0.4]}
                    position={[0.2, 0.2, 0.01]}
                    width={0.6}
                    userData={{way: "play"}}
                    height={0.4}
                    text={"Play"}
                />
                <Button3D
                    ref={pauseRef}
                    type={0}
                    scale={[0.4, 0.4, 0.4]}
                    position={[0.2, 0.0, 0.01]}
                    width={0.6}
                    height={0.4}
                    userData={{way: "pause"}}
                    text={"Pause"}
                />
                <Button3D
                    ref={stopRef}
                    type={0}
                    scale={[0.4, 0.4, 0.4]}
                    position={[0.2, -0.2, 0.01]}
                    width={0.6}
                    userData={{way: "stop"}}
                    height={0.4}
                    text={"Stop"}
                />
            </entity>
        );
    } else {
        return renderAsEntity(
            world,
            <entity name="Audio" networked networkedAudio grabbable={{ cursor: true, hand: false }}></entity>
        );
    }
}
