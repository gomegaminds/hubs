import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addComponent, addEntity } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";
import { MediaAudio, AudioEmitter } from "../bit-components";
import { audioTexture } from "../utils/audio-texture";
import { makeAudioSourceEntity } from "../bit-systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";

export function inflateAudio(world, eid, element) {
    console.log("Got inflateaudio", eid, element);
    const mesh = createImageMesh(audioTexture, 2);
    const ref =  MediaAudio.ref[eid] = APP.getSid(element.url)

    let audio = new THREE.PositionalAudio(APP.audioListener);
    let audioSystem = window.APP.scene.systems["hubs-systems"].audioSystem

    addComponent(world, AudioEmitter, eid);
    addComponent(world, MediaAudio, eid);
    // addObject3DComponent(world, eid, mesh);
    addObject3DComponent(world, eid, audio);

    audioSystem.addAudio({ sourceType: 0, node: audio });
    APP.audios.set(eid, audio);
    // updateAudioSettings(eid, audio);


    console.log("Added audio element", audio);

    return eid;
}
