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

const OUT_OF_SYNC_SEC = 5;
const networkedAudioQuery = defineQuery([NetworkedAudio]);
const mediaAudioQuery = defineQuery([MediaAudio]);
const mediaAudioEnterQuery = enterQuery(mediaAudioQuery);
export function audioSystem(world, audioSystem) {
    mediaAudioEnterQuery(world).forEach(function (eid) {
        const audioobj = world.eid2obj.get(eid);
        const audio = audioobj.children[0]

        if (MediaAudio.autoPlay[eid]) {
            audio.play().catch(() => {
                // Need to deal with the fact play() may fail if user has not interacted with browser yet.
                console.error("Error auto-playing video.");
            });
        }
    });

    /*
    networkedAudioQuery(world).forEach(function (eid) {
        const audio = world.eid2obj.get(eid).children[0]

        console.log("Got networked audio qurey for", eid);

        if (hasComponent(world, Owned, eid)) {
            NetworkedAudio.time[eid] = audio._progress;
            let flags = 0;
            flags |= !audio.isPlaying ? 1 : 0;
            NetworkedAudio.flags[eid] = flags;
        } else {
            const networkedPauseState = !!(NetworkedAudio.flags[eid] & 1);
            if (networkedPauseState === audio.isPlaying) {
                audio.isPlaying ? audio.play() : audio.pause();
            }
            if (networkedPauseState || Math.abs(NetworkedAudio.time[eid] - audio._progress) > OUT_OF_SYNC_SEC) {
                audio._progress = NetworkedVideo.time[eid];
            }
        }
    });
    */
}
