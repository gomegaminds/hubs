import { addComponent, addEntity, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import {
    PositionalAudio,
    Audio as StereoAudio,
    Mesh,
    MeshStandardMaterial,
    AudioListener as ThreeAudioListener
} from "three";
import { HubsWorld } from "../app";
import {
    AudioEmitter,
    MediaAudio,
    NetworkedAudio,
    AudioSettingsChanged,
    MediaVideo,
    NetworkedVideo,
    Owned
} from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

export function makeAudioSourceEntity(world, audioEl, audioSystem) {
    const eid = addEntity(world);
    const element = APP.sourceType.set(eid, SourceType.MEDIA_VIDEO);

    let audio;
    const { audioType } = getCurrentAudioSettings(eid);
    const audioListener = APP.audioListener;

    if (audioType === AudioType.PannerNode) {
        audio = new PositionalAudio(audioListener);
    } else {
        audio = new StereoAudio(audioListener);
    }

    console.log("Started creating audio", audio);

    addComponent(world, AudioEmitter, eid);
    addObject3DComponent(world, eid, audio);

    audio.gain.gain.value = 0;
    // Here we need to set the src
    audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: audio });

    audio.src = audioEl;

    APP.audios.set(eid, audio);
    updateAudioSettings(eid, audio);

    // audioEl.volume = 1;
    return eid;
}

function isPositionalAudio(node) {
    return node.panner !== undefined;
}

function swapAudioType(world, audioSystem, eid, NewType) {
    const audio = world.eid2obj.get(eid);
    audio.disconnect();
    audioSystem.removeAudio({ node: audio });

    const newAudio = new NewType(APP.audioListener);
    newAudio.setNodeSource(audio.source);
    audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: newAudio });
    APP.audios.set(eid, newAudio);

    audio.parent.add(newAudio);
    audio.removeFromParent();

    swapObject3DComponent(world, eid, newAudio);
}

// TODO this can live outside of video system
const staleAudioEmittersQuery = defineQuery([AudioEmitter, AudioSettingsChanged]);
function audioEmitterSystem(world, audioSystem) {
    staleAudioEmittersQuery(world).forEach(function (eid) {
        const audio = world.eid2obj.get(eid);
        const settings = getCurrentAudioSettings(eid);
        const isPannerNode = isPositionalAudio(audio);

        // TODO this needs more testing
        if (!isPannerNode && settings.audioType === AudioType.PannerNode) {
            swapAudioType(world, audioSystem, eid, PositionalAudio);
        } else if (isPannerNode && settings.audioType === AudioType.Stereo) {
            swapAudioType(world, audioSystem, eid, StereoAudio);
        }

        applySettings(audio, settings);
        removeComponent(world, AudioSettingsChanged, eid);
    });
}

const OUT_OF_SYNC_SEC = 5;
const networkedAudioQuery = defineQuery([NetworkedAudio]);
const mediaAudioQuery = defineQuery([MediaAudio]);
const mediaAudioEnterQuery = enterQuery(mediaAudioQuery);
export function audioSystem(world, audioSystem) {
    mediaAudioEnterQuery(world).forEach(function (eid) {
        const audioobj = world.eid2obj.get(eid);
        console.log("Audio initialized", eid, audioobj);
        const audioElement = APP.getString(MediaAudio.ref[eid]);
        console.log("Element should be ref", audioElement);

        const audioFinished = world.eid2obj.get(makeAudioSourceEntity(world, audioElement, audioSystem));
        console.log("Audio finished and created new audio source entity", audioFinished);
        // audio.play();
        // AudioRef
        // audioobj.add(audioFinished);

        // Note in media-video we call updateMatrixWorld here to force PositionalAudio's updateMatrixWorld to run even
        // if it has an invisible parent. We don't want to have invisible parents now.
    });

    networkedAudioQuery(world).forEach(function (eid) {
        // TODO: Pause and play audio
        /* 
        const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
        if (hasComponent(world, Owned, eid)) {
            NetworkedVideo.time[eid] = video.currentTime;
            let flags = 0;
            flags |= video.paused ? Flags.PAUSED : 0;
            NetworkedVideo.flags[eid] = flags;
        } else {
            const networkedPauseState = !!(NetworkedVideo.flags[eid] & Flags.PAUSED);
            if (networkedPauseState !== video.paused) {
                video.paused ? video.play() : video.pause();
            }
            if (networkedPauseState || Math.abs(NetworkedVideo.time[eid] - video.currentTime) > OUT_OF_SYNC_SEC) {
                video.currentTime = NetworkedVideo.time[eid];
            }
        }
        */
    });
    /*
    networkedAudioQuery(world).forEach(function (eid) {
        const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
        if (hasComponent(world, Owned, eid)) {
            NetworkedVideo.time[eid] = video.currentTime;
            let flags = 0;
            flags |= video.paused ? Flags.PAUSED : 0;
            NetworkedVideo.flags[eid] = flags;
        } else {
            const networkedPauseState = !!(NetworkedVideo.flags[eid] & Flags.PAUSED);
            if (networkedPauseState !== video.paused) {
                video.paused ? video.play() : video.pause();
            }
            if (networkedPauseState || Math.abs(NetworkedVideo.time[eid] - video.currentTime) > OUT_OF_SYNC_SEC) {
                video.currentTime = NetworkedVideo.time[eid];
            }
        }
    });
    */
}
