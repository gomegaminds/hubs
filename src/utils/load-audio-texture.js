import { createVideoOrAudioEl } from "../utils/media-utils";
import { audioTexture } from "./audio-texture";

export async function loadAudioTexture(src) {
    console.log("audiotexture src", src);
    const audioEl = createVideoOrAudioEl("audio");

    const isReady = () => {
        return (texture.image.videoHeight || texture.image.height) && (texture.image.videoWidth || texture.image.width);
    };

    return new Promise((resolve, reject) => {
        let pollTimeout;
        const failLoad = function (e) {
            audioEl.onerror = null;
            clearTimeout(pollTimeout);
            reject(e);
        };

        audioEl.src = src;
        audioEl.play();
        console.log(audioEl);
        audioEl.onerror = failLoad;

        const height = texture.image.videoHeight || texture.image.height;
        const width = texture.image.videoWidth || texture.image.width;
        resolve({ texture, audioSourceEl: texture.image, ratio: height / width });
    });
}
