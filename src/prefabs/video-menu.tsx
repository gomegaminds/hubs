/** @jsx createElementEntity */
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { Label } from "../prefabs/camera-tool";
import { AlphaMode } from "../utils/create-image-mesh";
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";

import { textureLoader } from "../utils/media-utils";
import playImageUrl from "../assets/images/sprites/notice/play.png";
import pauseImageUrl from "../assets/images/sprites/notice/pause.png";
import { TextureCache } from "../utils/texture-cache";
import { Button3D, BUTTON_TYPES } from "../prefabs/button3D";

const playTexture = textureLoader.load(playImageUrl);
const pauseTexture = textureLoader.load(pauseImageUrl);

function Slider({ trackRef, headRef, ...props }: any) {
    return (
        <entity {...props} name="Slider">
            <entity
                name="Slider:Track"
                videoMenuItem
                object3D={
                    new Mesh(
                        new PlaneBufferGeometry(1.0, 0.05),
                        new MeshBasicMaterial({ opacity: 0.5, color: 0x000000, transparent: true })
                    )
                }
                cursorRaycastable
                remoteHoverTarget
                holdable
                holdableButton
                ref={trackRef}
            >
                <entity
                    name="Slider:Head"
                    object3D={new Mesh(new BoxBufferGeometry(0.05, 0.05, 0.05), new MeshBasicMaterial())}
                    ref={headRef}
                />
            </entity>
        </entity>
    );
}

export function VideoMenuPrefab() {
    const uiZ = 0.002;
    const timeLabelRef = createRef();
    const headRef = createRef();
    const trackRef = createRef();
    const playIndicatorRef = createRef();
    const pauseIndicatorRef = createRef();
    const liveStopIndicatorRef = createRef();
    const halfHeight = 9 / 16 / 2;

    return (
        <entity
            name="Video Menu"
            videoMenu={{ timeLabelRef, headRef, trackRef, playIndicatorRef, pauseIndicatorRef, liveStopIndicatorRef }}
        >
            <Label
                name="Time Label"
                text={{ anchorY: "top", anchorX: "right" }}
                ref={timeLabelRef}
                scale={[0.5, 0.5, 0.5]}
                position={[0.5 - 0.02, halfHeight - 0.02, uiZ]}
            />
            <Slider trackRef={trackRef} headRef={headRef} position={[0, -halfHeight + 0.025, uiZ]} />
            <Button3D
                ref={playIndicatorRef}
                videoMenuItem
                type={0}
                scale={[0.25, 0.25, 0.25]}
                position={[0, 0, uiZ]}
                width={0.6}
                userData={{ way: "play" }}
                height={0.4}
                text={"Play"}
                visible={true}
            />
            <Button3D
                ref={pauseIndicatorRef}
                type={0}
                videoMenuItem
                scale={[0.25, 0.25, 0.25]}
                position={[0, 0, uiZ]}
                width={0.6}
                userData={{ way: "pause" }}
                height={0.4}
                text={"Pause"}
                visible={false}
            />
            <Button3D
                ref={liveStopIndicatorRef}
                videoMenuItem
                type={0}
                scale={[0.25, 0.25, 0.25]}
                position={[0, -0.15, uiZ]}
                width={0.6}
                userData={{ way: "stopSharing" }}
                height={0.4}
                text={"Stop Sharing"}
                visible={true}
            />
        </entity>
    );
}
