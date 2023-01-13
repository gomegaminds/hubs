import { computeObjectAABB, getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import {
    resolveUrl,
    fetchContentType,
    getDefaultResolveQuality,
    injectCustomShaderChunks,
    addMeshScaleAnimation,
    closeExistingMediaMirror
} from "../utils/media-utils";
import {
    isNonCorsProxyDomain,
    guessContentType,
    proxiedUrlFor,
    isHubsRoomUrl,
    isLocalHubsSceneUrl,
    isLocalHubsAvatarUrl
} from "../utils/media-url-utils";
import { addAnimationComponents } from "../utils/animation";

import loadingObjectSrc from "../assets/models/LoadingObject_Atom.glb";
import { SOUND_MEDIA_LOADING, SOUND_MEDIA_LOADED } from "../systems/sound-effects-system";
import { loadModel } from "./gltf-model-plus";
import { cloneObject3D, setMatrixWorld } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";

import { SHAPE } from "three-ammo/constants";
import { addComponent, entityExists, removeComponent } from "bitecs";
import { MediaLoading } from "../bit-components";

let loadingObject;

waitForDOMContentLoaded().then(() => {
    loadModel(loadingObjectSrc).then(gltf => {
        loadingObject = gltf;
    });
});

AFRAME.registerComponent("media-loader", {
    schema: {
        playSoundEffect: { default: true },
        fileId: { type: "string" },
        fileIsOwned: { type: "boolean" },
        src: { type: "string" },
        version: { type: "number", default: 1 }, // Used to force a re-resolution
        fitToBox: { default: false },
        moveTheParentNotTheMesh: { default: false },
        resolve: { default: false },
        contentType: { default: null },
        contentSubtype: { default: null },
        animate: { default: true },
        linkedEl: { default: null }, // This is the element of which this is a linked derivative. See linked-media.js
        mediaOptions: {
            default: {},
            parse: v => (typeof v === "object" ? v : JSON.parse(v)),
            stringify: JSON.stringify
        }
    },

    init() {
        this.onError = this.onError.bind(this);
        this.showLoader = this.showLoader.bind(this);
        this.clearLoadingTimeout = this.clearLoadingTimeout.bind(this);
        this.onMediaLoaded = this.onMediaLoaded.bind(this);
        this.handleLinkedElRemoved = this.handleLinkedElRemoved.bind(this);
        this.refresh = this.refresh.bind(this);
        this.animating = false;

        try {
            NAF.utils
                .getNetworkedEntity(this.el)
                .then(networkedEl => {
                    this.networkedEl = networkedEl;
                })
                .catch(() => {}); //ignore exception, entity might not be networked
        } catch (e) {
            // NAF may not exist on scene landing page
        }
    },

    updateScale: (function () {
        const center = new THREE.Vector3();
        const originalMeshMatrix = new THREE.Matrix4();
        const desiredObjectMatrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const box = new THREE.Box3();
        return function (fitToBox, moveTheParentNotTheMesh) {
            this.el.object3D.updateMatrices();
            this.el.object3D.updateMatrix();
            const mesh = this.el.getObject3D("mesh");
            mesh.updateMatrices();
            if (moveTheParentNotTheMesh) {
                if (fitToBox) {
                    console.warn(
                        "Unexpected combination of inputs. Can fit the mesh to a box OR move the parent to the mesh, but did not expect to do both.",
                        this.el
                    );
                }
                // Keep the mesh exactly where it is, but move the parent transform such that it aligns with the center of the mesh's bounding box.
                originalMeshMatrix.copy(mesh.matrixWorld);
                computeObjectAABB(mesh, box);
                center.addVectors(box.min, box.max).multiplyScalar(0.5);
                this.el.object3D.matrixWorld.decompose(position, quaternion, scale);
                desiredObjectMatrix.compose(center, quaternion, scale);
                setMatrixWorld(this.el.object3D, desiredObjectMatrix);
                mesh.updateMatrices();
                setMatrixWorld(mesh, originalMeshMatrix);
            } else {
                // Move the mesh such that the center of its bounding box is in the same position as the parent matrix position
                const box = getBox(this.el, mesh);
                const scaleCoefficient = fitToBox ? getScaleCoefficient(0.5, box) : 1;
                const { min, max } = box;
                center.addVectors(min, max).multiplyScalar(0.5 * scaleCoefficient);
                mesh.scale.multiplyScalar(scaleCoefficient);
                mesh.position.sub(center);
                mesh.matrixNeedsUpdate = true;
            }
        };
    })(),

    removeShape(id) {
        if (this.el.getAttribute("shape-helper__" + id)) {
            this.el.removeAttribute("shape-helper__" + id);
        }
    },

    tick(t, dt) {
        if (this.loaderMixer) {
            this.loaderMixer.update(dt / 1000);
        }
    },

    handleLinkedElRemoved(e) {
        if (e.detail.name === "media-loader") {
            this.data.linkedEl.removeEventListener("componentremoved", this.handleLinkedElRemoved);
        }
    },

    remove() {
        if (this.data.linkedEl) {
            this.data.linkedEl.removeEventListener("componentremoved", this.handleLinkedElRemoved);
        }

        const sfx = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;
        if (this.loadingSoundEffect) {
            sfx.stopPositionalAudio(this.loadingSoundEffect);
            this.loadingSoundEffect = null;
        }
        if (this.loadedSoundEffect) {
            sfx.stopPositionalAudio(this.loadedSoundEffect);
            this.loadedSoundEffect = null;
        }
    },

    onError() {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-pager");
        this.el.removeAttribute("audio-zone-source");
        this.clearLoadingTimeout();
    },

    showLoader() {
        if (this.el.object3DMap.mesh) {
            this.clearLoadingTimeout();
            return;
        }
        const useFancyLoader = !!loadingObject;

        const mesh = useFancyLoader
            ? cloneObject3D(loadingObject.scene)
            : new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
        this.el.setObject3D("mesh", mesh);

        this.updateScale(true, false);

        if (useFancyLoader) {
            this.loaderMixer = new THREE.AnimationMixer(mesh);

            this.loadingClip = this.loaderMixer.clipAction(mesh.animations[0]);
            this.loadingScaleClip = this.loaderMixer.clipAction(
                new THREE.AnimationClip(null, 1000, [
                    new THREE.VectorKeyframeTrack(
                        ".scale",
                        [0, 0.2],
                        [0, 0, 0, mesh.scale.x, mesh.scale.y, mesh.scale.z]
                    )
                ])
            );
            setTimeout(() => {
                if (!this.loaderMixer) return; // Animation/loader was stopped early
                this.el.setAttribute("shape-helper__loader", { type: SHAPE.BOX });
            }, 200);

            this.loadingClip.play();
            this.loadingScaleClip.play();
        }

        if (
            this.el.sceneEl.is("entered") &&
            (!this.networkedEl || NAF.utils.isMine(this.networkedEl)) &&
            this.data.playSoundEffect
        ) {
            this.loadingSoundEffect = this.el.sceneEl.systems[
                "hubs-systems"
            ].soundEffectsSystem.playPositionalSoundFollowing(SOUND_MEDIA_LOADING, this.el.object3D, true);
        }

        delete this.showLoaderTimeout;
    },

    clearLoadingTimeout() {
        clearTimeout(this.showLoaderTimeout);
        if (this.loadingSoundEffect) {
            this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.stopPositionalAudio(this.loadingSoundEffect);
            this.loadingSoundEffect = null;
        }
        if (this.loaderMixer) {
            this.loadingClip.stop();
            this.loadingScaleClip.stop();
            delete this.loaderMixer;
            delete this.loadingScaleClip;
            delete this.loadingClip;
        }
        delete this.showLoaderTimeout;
        this.removeShape("loader");
    },

    updateHoverableVisuals: (function () {
        const boundingBox = new THREE.Box3();
        const boundingSphere = new THREE.Sphere();
        return function () {
            const hoverableVisuals = this.el.components["hoverable-visuals"];

            if (hoverableVisuals) {
                if (!this.injectedCustomShaderChunks) {
                    this.injectedCustomShaderChunks = true;
                    hoverableVisuals.uniforms = injectCustomShaderChunks(this.el.object3D);
                }

                boundingBox.setFromObject(this.el.object3DMap.mesh);
                boundingBox.getBoundingSphere(boundingSphere);
                hoverableVisuals.geometryRadius = boundingSphere.radius / this.el.object3D.scale.y;
            }
        };
    })(),

    onMediaLoaded(physicsShape = null, shouldUpdateScale) {
        const el = this.el;
        this.clearLoadingTimeout();

        if (this.el.sceneEl.is("entered") && this.data.playSoundEffect) {
            this.loadedSoundEffect = this.el.sceneEl.systems[
                "hubs-systems"
            ].soundEffectsSystem.playPositionalSoundFollowing(SOUND_MEDIA_LOADED, this.el.object3D, false);
        }

        const finish = () => {
            this.animating = false;

            if (physicsShape) {
                el.setAttribute("shape-helper", {
                    type: physicsShape,
                    minHalfExtent: 0.04
                });
            }

            this.updateHoverableVisuals();

            if (this.data.linkedEl) {
                this.el.sceneEl.systems["linked-media"].registerLinkage(this.data.linkedEl, this.el);
                this.data.linkedEl.addEventListener("componentremoved", this.handleLinkedElRemoved);
            }

            // TODO this does duplicate work in some cases, but finish() is the only consistent place to do it
            this.contentBounds = getBox(this.el, this.el.getObject3D("mesh")).getSize(new THREE.Vector3());

            el.emit("media-loaded");
            if (el.eid && entityExists(APP.world, el.eid)) {
                removeComponent(APP.world, MediaLoading, el.eid);
            }
        };

        if (this.data.animate) {
            if (!this.animating) {
                this.animating = true;
                if (shouldUpdateScale) this.updateScale(this.data.fitToBox, this.data.moveTheParentNotTheMesh);
                const mesh = this.el.getObject3D("mesh");
                const scale = { x: 0.001, y: 0.001, z: 0.001 };
                scale.x = mesh.scale.x < scale.x ? mesh.scale.x * 0.001 : scale.x;
                scale.y = mesh.scale.y < scale.y ? mesh.scale.x * 0.001 : scale.y;
                scale.z = mesh.scale.z < scale.z ? mesh.scale.x * 0.001 : scale.z;
                addMeshScaleAnimation(mesh, scale, finish);
            }
        } else {
            if (shouldUpdateScale) this.updateScale(this.data.fitToBox, this.data.moveTheParentNotTheMesh);
            finish();
        }
    },

    refresh() {
        if (this.networkedEl && !NAF.utils.isMine(this.networkedEl) && !NAF.utils.takeOwnership(this.networkedEl))
            return;

        // When we refresh, we bump the version to the current timestamp.
        //
        // The only use-case for refresh right now is re-fetching screenshots.
        this.el.setAttribute("media-loader", { version: Math.floor(Date.now() / 1000) });
    },

    async update(oldData, forceLocalRefresh) {
        const { version, contentSubtype } = this.data;
        let src = this.data.src;
        if (!src) return;

        const srcChanged = oldData.src !== src;
        const versionChanged = !!(oldData.version && oldData.version !== version);

        if (versionChanged) {
            this.el.emit("media_refreshing");

            // Don't animate if its a refresh.
            this.data.animate = false;

            // Play the sound effect on a refresh only if we are the owner
            this.data.playSoundEffect = NAF.utils.isMine(this.networkedEl);
        }

        if (forceLocalRefresh) {
            this.el.removeAttribute("gltf-model-plus");
            this.el.removeAttribute("media-pager");
            this.el.removeAttribute("audio-zone-source");
        }

        try {
            if ((forceLocalRefresh || srcChanged) && !this.showLoaderTimeout) {
                this.showLoaderTimeout = setTimeout(this.showLoader, 100);
                addComponent(APP.world, MediaLoading, this.el.eid);
            }

            //check if url is an anchor hash e.g. #Spawn_Point_1
            if (src.charAt(0) === "#") {
                src =
                    this.data.src = `${window.location.origin}${window.location.pathname}${window.location.search}${src}`;
            }

            console.log("src", src);

            let canonicalUrl = src;
            let canonicalAudioUrl = null; // set non-null only if audio track is separated from video track (eg. 360 video)
            let accessibleUrl = src;
            let contentType = this.data.contentType;
            let thumbnail;

            const parsedUrl = new URL(src);

            // We want to resolve and proxy some hubs urls, like rooms and scene links,
            // but want to avoid proxying assets in order for this to work in dev environments
            const isLocalModelAsset =
                isNonCorsProxyDomain(parsedUrl.hostname) && (guessContentType(src) || "").startsWith("model/gltf");

            console.log(src);
            const isMegaMindsAsset =
                src.startsWith("http://localhost") ||
                src.startsWith("https://api.megaminds.world") ||
                src.includes("megaminds.world");

            if (
                !isMegaMindsAsset &&
                this.data.resolve &&
                !src.startsWith("data:") &&
                !src.startsWith("hubs:") &&
                !isLocalModelAsset
            ) {
                const is360 = !!(
                    this.data.mediaOptions.projection && this.data.mediaOptions.projection.startsWith("360")
                );
                const quality = getDefaultResolveQuality(is360);
                const result = await resolveUrl(src, quality, version, forceLocalRefresh);
                canonicalUrl = result.origin;

                // handle protocol relative urls
                if (canonicalUrl.startsWith("//")) {
                    canonicalUrl = location.protocol + canonicalUrl;
                }

                canonicalAudioUrl = result.origin_audio;
                if (canonicalAudioUrl && canonicalAudioUrl.startsWith("//")) {
                    canonicalAudioUrl = location.protocol + canonicalAudioUrl;
                }

                contentType = (result.meta && result.meta.expected_content_type) || contentType;
                thumbnail = result.meta && result.meta.thumbnail && proxiedUrlFor(result.meta.thumbnail);
            }

            // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
            accessibleUrl = proxiedUrlFor(canonicalUrl);

            // if the component creator didn't know the content type, we didn't get it from reticulum, and
            // we don't think we can infer it from the extension, we need to make a HEAD request to find it out
            contentType = contentType || guessContentType(canonicalUrl) || (await fetchContentType(accessibleUrl));

            // TODO we should probably just never return "application/octet-stream" as expectedContentType, since its not really useful
            if (contentType === "application/octet-stream") {
                contentType = guessContentType(canonicalUrl) || contentType;
            }

            // Some servers treat m3u8 playlists as "audio/x-mpegurl", we always want to treat them as HLS videos
            if (contentType === "audio/x-mpegurl" || contentType === "audio/mpegurl") {
                contentType = "application/vnd.apple.mpegurl";
            }

            // We don't want to emit media_resolved for index updates.
            if (forceLocalRefresh || srcChanged) {
                this.el.emit("media_resolved", { src, raw: accessibleUrl, contentType });
            } else {
                this.el.emit("media_refreshed", { src, raw: accessibleUrl, contentType });
            }

            if (
                contentType.startsWith("video/") ||
                contentType.startsWith("audio/") ||
                contentType.startsWith("application/dash") ||
                AFRAME.utils.material.isHLS(canonicalUrl, contentType)
            ) {
                let linkedVideoTexture, linkedAudioSource, linkedMediaElementAudioSource;

                const qsTime = parseInt(parsedUrl.searchParams.get("t"));
                const hashTime = parseInt(new URLSearchParams(parsedUrl.hash.substring(1)).get("t"));
                const startTime = hashTime || qsTime || 0;
                this.el.removeAttribute("gltf-model-plus");
                this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
                this.el.addEventListener(
                    "video-loaded",
                    e => {
                        this.onMediaLoaded(e.detail.projection === "flat" ? SHAPE.BOX : null);
                    },
                    { once: true }
                );
                this.el.setAttribute("audio-zone-source", {});
                if (this.el.components["position-at-border__freeze"]) {
                    this.el.setAttribute("position-at-border__freeze", { isFlat: true });
                }
                if (this.el.components["position-at-border__freeze-unprivileged"]) {
                    this.el.setAttribute("position-at-border__freeze-unprivileged", { isFlat: true });
                }
            } else if (contentType.startsWith("image/")) {
                this.el.removeAttribute("gltf-model-plus");
                this.el.removeAttribute("audio-zone-source");
                this.el.removeAttribute("media-pager");
                this.el.addEventListener(
                    "image-loaded",
                    e => {
                        this.onMediaLoaded(e.detail.projection === "flat" ? SHAPE.BOX : null);
                    },
                    { once: true }
                );
                this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });

                if (this.el.components["position-at-border__freeze"]) {
                    this.el.setAttribute("position-at-border__freeze", { isFlat: true });
                }
                if (this.el.components["position-at-border__freeze-unprivileged"]) {
                    this.el.setAttribute("position-at-border__freeze-unprivileged", { isFlat: true });
                }
            } else if (contentType.startsWith("application/pdf")) {
                this.el.removeAttribute("gltf-model-plus");
                this.el.removeAttribute("audio-zone-source");
                this.el.setAttribute("media-pager", {});
                this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
                this.el.addEventListener(
                    "pdf-loaded",
                    () => {
                        this.clearLoadingTimeout();
                        this.onMediaLoaded(SHAPE.BOX);
                    },
                    { once: true }
                );

                if (this.el.components["position-at-border__freeze"]) {
                    this.el.setAttribute("position-at-border__freeze", { isFlat: true });
                }
                if (this.el.components["position-at-border__freeze-unprivileged"]) {
                    this.el.setAttribute("position-at-border__freeze-unprivileged", { isFlat: true });
                }
            } else if (
                contentType.includes("application/octet-stream") ||
                contentType.includes("x-zip-compressed") ||
                contentType.startsWith("model/gltf")
            ) {
                this.el.removeAttribute("audio-zone-source");
                this.el.removeAttribute("media-pager");

                this.el.addEventListener(
                    "model-loaded",
                    () => {
                        setTimeout(() => {
                            this.onMediaLoaded(SHAPE.HULL, true);
                            addAnimationComponents(this.el);
                        }, 1000);
                    },
                    { once: false }
                );
                this.el.addEventListener("model-error", this.onError, { once: true });
                if (this.data.mediaOptions.hasOwnProperty("applyGravity")) {
                    this.el.setAttribute("floaty-object", {
                        modifyGravityOnRelease: !this.data.mediaOptions.applyGravity
                    });
                }
                this.el.setAttribute(
                    "gltf-model-plus",
                    Object.assign({}, this.data.mediaOptions, {
                        src: accessibleUrl,
                        contentType: contentType,
                        inflate: true,
                        modelToWorldScale: this.data.fitToBox ? 0.0001 : 1.0
                    })
                );
            } else if (contentType.startsWith("text/html")) {
                this.el.removeAttribute("gltf-model-plus");
                this.el.removeAttribute("audio-zone-source");
                this.el.removeAttribute("media-pager");
                this.el.addEventListener(
                    "image-loaded",
                    async () => {
                        this.onMediaLoaded(SHAPE.BOX);
                    },
                    { once: true }
                );
                this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
                if (this.el.components["position-at-border__freeze"]) {
                    this.el.setAttribute("position-at-border__freeze", { isFlat: true });
                }
                if (this.el.components["position-at-border__freeze-unprivileged"]) {
                    this.el.setAttribute("position-at-border__freeze-unprivileged", { isFlat: true });
                }
            } else {
                throw new Error(`Unsupported content type: ${contentType}`);
            }
        } catch (e) {
            if (this.el.components["position-at-border__freeze"]) {
                this.el.setAttribute("position-at-border__freeze", { isFlat: true });
            }
            if (this.el.components["position-at-border__freeze-unprivileged"]) {
                this.el.setAttribute("position-at-border__freeze-unprivileged", { isFlat: true });
            }
            console.error("Error adding media", e);
            this.onError();
        }
    }
});
