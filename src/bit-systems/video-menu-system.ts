import { addComponent, defineQuery, enterQuery, entityExists, hasComponent, removeComponent } from "bitecs";
import { Mesh, MeshBasicMaterial, Object3D, Plane, Ray, Vector3 } from "three";
import { clamp, mapLinear } from "three/src/math/MathUtils";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import {
    CursorRaycastable,
    Held,
    HeldRemoteRight,
    HoveredRemoteRight,
    MediaVideo,
    NetworkedVideo,
    VideoMenu,
    VideoMenuItem
} from "../bit-components";
import { takeOwnership } from "../utils/take-ownership";
import { paths } from "../systems/userinput/paths";
import { animate } from "../utils/animate";
import { coroutine } from "../utils/coroutine";
import { easeOutQuadratic } from "../utils/easing";
import { isFacingCamera } from "../utils/three-utils";

export function timeFmt(t: any) {
    let s: any = Math.floor(t),
        h: any = Math.floor(s / 3600);
    s -= h * 3600;
    let m: any = Math.floor(s / 60);
    s -= m * 60;
    if (h < 10) h = `0${h}`;
    if (m < 10) m = `0${m}`;
    if (s < 10) s = `0${s}`;
    return h === "00" ? `${m}:${s}` : `${h}:${m}:${s}`;
}

const videoMenuQuery = defineQuery([VideoMenu]);
const hoverRightVideoQuery = defineQuery([HoveredRemoteRight, MediaVideo]);
const hoverRightVideoEnterQuery = enterQuery(hoverRightVideoQuery);
const hoverRightMenuItemQuery = defineQuery([HoveredRemoteRight, VideoMenuItem]);
const sliderHalfWidth = 0.475;

function setCursorRaycastable(world: HubsWorld, menu: number, enable: boolean) {
    let change = enable ? addComponent : removeComponent;
    change(world, CursorRaycastable, menu);
    change(world, CursorRaycastable, VideoMenu.trackRef[menu]);
}

const intersectInThePlaneOf = (() => {
    const plane = new Plane();
    const ray = new Ray();
    type Pose = { position: Vector3; direction: Vector3 };
    return function intersectInThePlaneOf(obj: Object3D, { position, direction }: Pose, intersection: Vector3) {
        ray.set(position, direction);
        plane.normal.set(0, 0, 1);
        plane.constant = 0;
        obj.updateMatrices();
        plane.applyMatrix4(obj.matrixWorld);
        ray.intersectPlane(plane, intersection);
    };
})();

type Job<T> = () => IteratorResult<undefined, T>;
let rightMenuIndicatorCoroutine: Job<void> | null = null;

let intersectionPoint = new Vector3();
export function videoMenuSystem(world: HubsWorld, userinput: any) {
    const rightVideoMenu = videoMenuQuery(world)[0];
    const shouldHideVideoMenu =
        VideoMenu.videoRef[rightVideoMenu] &&
        (!entityExists(world, VideoMenu.videoRef[rightVideoMenu]) ||
            (!hoverRightVideoQuery(world).length &&
                !hoverRightMenuItemQuery(world).length &&
                !hasComponent(world, Held, VideoMenu.trackRef[rightVideoMenu])));

    if (shouldHideVideoMenu) {
        const menu = rightVideoMenu;
        const menuObj = world.eid2obj.get(menu)!;
        menuObj.removeFromParent();
        setCursorRaycastable(world, menu, false);
        VideoMenu.videoRef[menu] = 0;
    }

    hoverRightVideoEnterQuery(world).forEach(function (eid) {
        const menu = rightVideoMenu;
        VideoMenu.videoRef[menu] = eid;
        const menuObj = world.eid2obj.get(menu)!;
        const videoObj = world.eid2obj.get(eid)!;
        videoObj.add(menuObj);
        setCursorRaycastable(world, menu, true);
    });

    videoMenuQuery(world).forEach(function (eid) {
        const videoEid = VideoMenu.videoRef[eid];
        if (!videoEid) return;
        const menuObj = world.eid2obj.get(eid)!;
        const video = (world.eid2obj.get(videoEid) as any).material.map.image as HTMLVideoElement;

        const playIndicatorObj = world.eid2obj.get(VideoMenu.playIndicatorRef[eid])!;
        const pauseIndicatorObj = world.eid2obj.get(VideoMenu.pauseIndicatorRef[eid])!;

        if (video.paused) {
            playIndicatorObj.visible = true;
            pauseIndicatorObj.visible = false;
        } else {
            playIndicatorObj.visible = false;
            pauseIndicatorObj.visible = true;
        }

        const videoIsFacingCamera = isFacingCamera(world.eid2obj.get(videoEid)!);
        const yRot = videoIsFacingCamera ? 0 : Math.PI;
        if (menuObj.rotation.y !== yRot) {
            menuObj.rotation.y = yRot;
            menuObj.matrixNeedsUpdate = true;
        }

        const headObj = world.eid2obj.get(VideoMenu.headRef[eid])!;
        const trackObj = world.eid2obj.get(VideoMenu.trackRef[eid])!;
        const liveStopIndicator = world.eid2obj.get(VideoMenu.liveStopIndicatorRef[eid])!;

        if (video.duration === Infinity) {
            // Hide stuff on live video
            headObj.visible = false;
            trackObj.visible = false;
            liveStopIndicator.visible = true;
        } else {
            headObj.visible = true;
            trackObj.visible = true;
            liveStopIndicator.visible = false;
        }

        if (hasComponent(world, HeldRemoteRight, VideoMenu.trackRef[eid])) {
            intersectInThePlaneOf(trackObj, userinput.get(paths.actions.cursor.right.pose), intersectionPoint);
            if (intersectionPoint) {
                const newPosition = headObj.parent!.worldToLocal(intersectionPoint);
                video.currentTime =
                    mapLinear(
                        clamp(newPosition.x, -sliderHalfWidth, sliderHalfWidth),
                        -sliderHalfWidth,
                        sliderHalfWidth,
                        0,
                        1
                    ) * video.duration;
            }
            if (hasComponent(world, NetworkedVideo, videoEid)) {
                takeOwnership(world, videoEid);
            }
        }
        headObj.position.x = mapLinear(video.currentTime, 0, video.duration, -sliderHalfWidth, sliderHalfWidth);
        headObj.matrixNeedsUpdate = true;

        const timeLabelRef = world.eid2obj.get(VideoMenu.timeLabelRef[eid])! as TroikaText;
        if (video.duration !== Infinity) {
            timeLabelRef.text = `${timeFmt(video.currentTime)} / ${timeFmt(video.duration)}`;
            timeLabelRef.sync();
        } else {
            timeLabelRef.text = "Live";
            timeLabelRef.sync();
        }

        if (rightMenuIndicatorCoroutine && rightMenuIndicatorCoroutine().done) {
            rightMenuIndicatorCoroutine = null;
        }
    });
}

const START_SCALE = new Vector3().setScalar(0.05);
const END_SCALE = new Vector3().setScalar(0.25);
function* animateIndicator(world: HubsWorld, eid: number) {
    const obj = world.eid2obj.get(eid)!;
    yield* animate({
        properties: [
            [START_SCALE, END_SCALE],
            [0.75, 0]
        ],
        durationMS: 700,
        easing: easeOutQuadratic,
        fn: ([scale, opacity]: [Vector3, number]) => {
            obj.scale.copy(scale);
            obj.matrixNeedsUpdate = true;
            ((obj as Mesh).material as MeshBasicMaterial).opacity = opacity;
        }
    });
}
