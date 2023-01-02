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
    const mesh = createImageMesh(audioTexture, 1);

    addComponent(world, AudioEmitter, eid);
    addComponent(world, MediaAudio, eid);
    const sound = new THREE.PositionalAudio(APP.audioListener);

    MediaAudio.ref[eid] = APP.getSid(sound);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(element.url, function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
    });
    //
    let newEid = addObject3DComponent(world, eid, mesh);


    APP.world.eid2obj.get(newEid).add(sound);

    console.log("Added audio element", sound);

    return eid;
}
