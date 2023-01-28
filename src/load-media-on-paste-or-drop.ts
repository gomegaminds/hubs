import { addComponent } from "bitecs";
import { takeOwnership } from "./utils/take-ownership";
import { createNetworkedEntity } from "./utils/create-networked-entity";
import { NetworkedTransform, Owned } from "./bit-components";
import { upload, parseURL } from "./utils/media-utils";
import { guessContentType } from "./utils/media-url-utils";
import { AElement } from "aframe";
import { Vector3 } from "three";
import { toast } from "react-hot-toast";
import qsTruthy from "./utils/qs_truthy";

type UploadResponse = {
    file: string;
    id?: number;
};

export function spawnFromUrl(text: string) {
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
    const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
    const obj = APP.world.eid2obj.get(eid)!;
    obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
    obj.lookAt(avatarPov.getWorldPosition(new Vector3()));

    setTimeout(() => {
        window.APP.objectHelper.save(eid);
    }, 1000);
    return obj;
}

export async function spawnFromFileList(files: FileList) {
    for (const file of files) {
        const desiredContentType = file.type || guessContentType(file.name);
        const { src, id } = await upload(file, desiredContentType)
            .then(function (response: UploadResponse) {
                console.log(response.id);
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
        const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
        const obj = APP.world.eid2obj.get(eid)!;
        obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
        obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));
        obj.updateMatrix();
        obj.matrixNeedsUpdate = true;

        setTimeout(() => {
            window.APP.objectHelper.save(eid, id);
        }, 1000);
    }
}

async function onPaste(e: ClipboardEvent) {
    if (!(AFRAME as any).scenes[0].is("entered")) {
        return;
    }

    if (!window.APP.objectHelper) {
        return;
    }

    if (!window.APP.objectHelper.can("can_create")) {
        return;
    }

    const isPastedInChat =
        ((e.target! as Element).matches("input, textarea") || (e.target! as HTMLElement).contentEditable === "true") &&
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
    spawnFromUrl(text);
}

function onDrop(e: DragEvent) {
    if (!(AFRAME as any).scenes[0].is("entered")) {
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
        return spawnFromFileList(files);
    }
    const url = e.dataTransfer?.getData("url") || e.dataTransfer?.getData("text");
    if (url) {
        e.preventDefault();
        return spawnFromUrl(url);
    }
}

document.addEventListener("paste", onPaste);
document.addEventListener("drop", onDrop);
