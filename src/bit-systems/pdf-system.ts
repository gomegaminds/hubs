import { addComponent, addEntity, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import {
    PositionalAudio,
    Audio as StereoAudio,
    Mesh,
    MeshStandardMaterial,
    AudioListener as ThreeAudioListener
} from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged, NetworkedPDF, MediaPDF, NetworkedVideo, Owned } from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

const networkedPDFQuery = defineQuery([NetworkedPDF]);
const mediaPDFQuery = defineQuery([MediaPDF]);
const mediaPDFEnterQuery = enterQuery(mediaPDFQuery);
export function pdfSystem(world: HubsWorld) {
    mediaPDFEnterQuery(world).forEach(function (eid) {
        const pdfObj = world.eid2obj.get(eid) as any;
        const pageRef = MediaPDF.pageRef[eid]
        setTimeout(() => {
            pageRef.

        }, 2000);

        console.log("PDFSYSTEM", pdfObj, APP.getString(pageRef));
    });

    networkedPDFQuery(world).forEach(function (eid) {
        const pdf = world.eid2obj.get(eid);
        console.log("PDFSYSTEM", pdf);
    });
}
