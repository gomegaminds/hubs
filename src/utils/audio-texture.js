import errorImageSrc from "../assets/images/media-error.png?inline";

const errorImage = new Image();
errorImage.src = errorImageSrc;
export const audioTexture = new THREE.Texture(errorImage);
errorImage.onload = () => {
    audioTexture.needsUpdate = true;
};
