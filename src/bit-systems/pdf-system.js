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
    AudioSettingsChanged,
    NetworkedPDF,
    MediaPDF,
    PDFSettingsChanged,
    NetworkedVideo,
    Owned
} from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

const networkedPDFQuery = defineQuery([NetworkedPDF]);
const mediaPDFQuery = defineQuery([MediaPDF, PDFSettingsChanged]);
const mediaPDFEnterQuery = enterQuery(mediaPDFQuery);
var hasSet = false;

export function pdfSystem(world) {
    mediaPDFEnterQuery(world).forEach(function (eid) {
        const pageRef = APP.getString(MediaPDF.pageRef[eid]);
        const pdf = world.eid2obj.get(eid);
    });

    mediaPDFQuery(world).forEach(function (eid) {
        const pdf = world.eid2obj.get(eid);
        const newIndex = PDFSettingsChanged.newIndex[eid];
        console.log(newIndex);
        const pageRef = APP.getString(MediaPDF.pageRef[eid]);
        const canvas = pdf.material.map.image;
        const ctx = canvas.getContext("2d");

        pageRef.pdf.getPage(newIndex).then(page => {
            const viewport = page.getViewport({ scale: 3 });
            const render = page.render({ canvasContext: ctx, viewport: viewport }).promise.then(page => {
                pageRef.texture.needsUpdate = true;
            });
        });

        removeComponent(world, PDFSettingsChanged, eid);



        /*
        // When page index changes, render here
        const pageRef = APP.getString(MediaPDF.pageRef[eid]);
        const canvas = document.createElement("canvas");
        const canvasContext = canvas.getContext("2d");

        */
    });
}
