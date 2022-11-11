/* global performance */
import { addMedia } from "../utils/media-utils";
import { SOUND_SPAWN_EMOJI } from "../systems/sound-effects-system";
import emoji0Particle from "../assets/images/emojis/emoji_0.png";
import emoji1Particle from "../assets/images/emojis/emoji_1.png";
import emoji2Particle from "../assets/images/emojis/emoji_2.png";
import emoji3Particle from "../assets/images/emojis/emoji_3.png";
import emoji4Particle from "../assets/images/emojis/emoji_4.png";
import emoji5Particle from "../assets/images/emojis/emoji_5.png";
import emoji6Particle from "../assets/images/emojis/emoji_6.png";
import empty_model from "../assets/models/empty_model.glb";

export const emojis = [
    { id: "smile", particle: emoji0Particle },
    { id: "laugh", particle: emoji1Particle },
    { id: "clap", particle: emoji2Particle },
    { id: "heart", particle: emoji3Particle },
    { id: "wave", particle: emoji4Particle },
    { id: "angry", particle: emoji5Particle },
    { id: "cry", particle: emoji6Particle },
].map(({ particle, ...rest }) => {
    return {
        ...rest,
        particleEmitterConfig: {
            src: new URL(particle, window.location).href,
            resolve: false,
            particleCount: 20,
            startSize: 0.01,
            endSize: 0.2,
            sizeRandomness: 0.05,
            lifetime: 1,
            lifetimeRandomness: 0.2,
            ageRandomness: 1,
            startVelocity: { x: 0, y: 1, z: 0 },
            endVelocity: { x: 0, y: 0.25, z: 0 },
            startOpacity: 1,
            middleOpacity: 1,
            endOpacity: 0,
        },
    };
});


export function spawnEmojiInFrontOfUser({ particleEmitterConfig }) {
    const { entity } = addMedia(empty_model, "#interactable-emoji");

    entity.setAttribute("offset-relative-to", {
        target: "#avatar-pov-node",
        offset: { x: 0, y: 0, z: -1.5 },
    });

    entity.addEventListener("model-loaded", () => {
        entity.querySelector(".particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
        // entity.setAttribute("particle-emitter", particleEmitterConfig);
        setTimeout(() => entity.parentNode.removeChild(entity), 4000);
    });
}
