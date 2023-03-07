import { addComponent } from "bitecs";
import { takeOwnership } from "./utils/take-ownership";
import { createNetworkedEntity } from "./utils/create-networked-entity";
import youtube_model from "./assets/models/youtube.glb";
import { NetworkedTransform, Owned } from "./bit-components";
import { upload, parseURL } from "./utils/media-utils";
import { guessContentType } from "./utils/media-url-utils";
import { AElement } from "aframe";
import { Vector3 } from "three";
import { toast } from "react-hot-toast";
import qsTruthy from "./utils/qs_truthy";

export function spawnFromUrl(text) {
    if (!text) {
        return;
    }
    if (!parseURL(text)) {
        console.warn(`Could not parse URL. Ignoring pasted text:\n${text}`);
        return;
    }
    const eid = createNetworkedEntity(APP.world, "media", {
        src: text,
        recenter: true,
        resize: true
    });
    const avatarPov = document.querySelector("#avatar-pov-node").object3D;
    const obj = APP.world.eid2obj.get(eid);
    obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
    obj.lookAt(avatarPov.getWorldPosition(new Vector3()));

    setTimeout(() => {
        window.APP.objectHelper.save(eid, null, text, text);
    }, 1000);
    return obj;
}

export async function spawnFromFileList(files) {
    for (const file of files) {
        console.log(file);
        const desiredContentType = file.type || guessContentType(file.name);
        const unsupportedFiles = [
            "undefined",
            "video/x-ms-wmv",
            "video/x-msvideo",
            "video/3gpp",
            "",
            null,
            undefined,
            "audio/ac3",
            "audio/x-realaudio",
            "audio/x-ms-wma",
            "image/tiff"
        ];
        if (unsupportedFiles.includes(desiredContentType)) {
            throw "Unsupported filetype";
        } else {
            const { src, id } = await upload(file, desiredContentType)
                .then(function (response) {
                    if (response.file.startsWith("/")) {
                        return { src: "http://localhost:8000" + response.file, id: response.id };
                    } else {
                        return { src: response.file, id: response.id };
                    }
                })
                .catch(e => {
                    console.error("Media upload failed", e);
                    return {
                        src: "error",
                        id: null,
                        recenter: true,
                        resize: true,
                        animateLoad: true,
                        isObjectMenuTarget: true
                    };
                });

            const eid = createNetworkedEntity(APP.world, "media", { src: src, recenter: true, resize: true });
            const avatarPov = document.querySelector("#avatar-pov-node").object3D;
            const obj = APP.world.eid2obj.get(eid);
            obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
            obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));
            obj.updateMatrix();
            obj.matrixNeedsUpdate = true;

            setTimeout(() => {
                window.APP.objectHelper.save(eid, id, file.name);
                window.APP.scene.emit("new_asset");
            }, 1000);
        }
    }
}

async function onPaste(e) {
    if (!AFRAME.scenes[0].is("entered")) {
        return;
    }

    if (!window.APP.objectHelper) {
        return;
    }

    if (!window.APP.objectHelper.can("can_create")) {
        return;
    }

    const isPastedInChat =
        (e.target.matches("input, textarea") || e.target.contentEditable === "true") &&
        document.activeElement === e.target;
    if (isPastedInChat) {
        return;
    }
    if (!e.clipboardData) {
        return;
    }
    e.preventDefault();
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
        return spawnFromFileList(e.clipboardData.files);
    }
    const text = e.clipboardData.getData("text");

    const isYoutube = text.includes("youtube.com");
    if (isYoutube) {
        const eid = createNetworkedEntity(APP.world, "youtube", {
            src: youtube_model,
            recenter: true,
            resize: true,
            link: text
        });

        const avatarPov = document.querySelector("#avatar-pov-node").object3D;
        const obj = APP.world.eid2obj.get(eid);
        obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
        obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));

        setTimeout(() => {
            window.APP.objectHelper.save(eid);
        }, 1000);
    } else {
        try {
            url = new URL(string);
            spawnFromUrl(url);
        } catch {
            const eid = createNetworkedEntity(APP.world, "megaText", {
                value: text,
                fontSize: 0.2,
                maxWidth: 3,
                textAlign: "left",
                color: "#ffffff"
            });

            const avatarPov = document.querySelector("#avatar-pov-node").object3D;
            const obj = APP.world.eid2obj.get(eid);
            obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
            obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));

            setTimeout(() => {
                window.APP.objectHelper.save(eid);
            }, 1000);
        }
    }
}

function onDrop(e) {
    if (!AFRAME.scenes[0].is("entered")) {
        return;
    }

    if (!window.APP.objectHelper) {
        e.preventDefault();
        toast.error("We could not load the permissions for this room yet.");
        return;
    }

    if (!window.APP.objectHelper.can("can_create")) {
        e.preventDefault();
        toast.error("You do not have permission to upload content to this room.");
        return;
    }

    const files = e.dataTransfer?.files;
    if (files && files.length) {
        e.preventDefault();
        return toast.promise(spawnFromFileList(files), {
            loading: "Uploading...",
            success: "Uploaded",
            error: err => err.toString()
        });
    }
    const url = e.dataTransfer?.getData("url") || e.dataTransfer?.getData("text");
    if (url) {
        e.preventDefault();
        return toast.promise(spawnFromUrl(url), {
            loading: "Uploading...",
            success: "Uploaded",
            error: "An error occurred while uploading"
        });
    }
}

document.addEventListener("paste", onPaste);
document.addEventListener("drop", onDrop);
