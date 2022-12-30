import { HubsWorld } from "../app";
import { ProjectionMode } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";

export interface AudioLoaderParams {
    src: string;
    projection: ProjectionMode;
    autoPlay: boolean;
    controls: boolean;
    loop: boolean;
}

export function inflateAudioLoader(world: HubsWorld, eid: number, params: AudioLoaderParams) {
    console.log("Got all the way to inflate audio loader, attach it to object3d here?");

    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.PositionalAudio(window?.APP?.scene?.audioListener);
    audioLoader.load("sound.ugg", function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(1);
        sound.setRolloffFactor(500);
        sound.setMaxDistance(0.02);
        sound.play();
    });
}
