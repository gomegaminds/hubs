import { addComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import { anyEntityWith } from "../utils/bit-utils";
import {
    HeldRemoteLeft,
    HeldRemoteRight,
    HoveredRemoteLeft,
    HoveredRemoteRight,
    NotRemoteHoverTarget,
    RemoteHoverTarget
} from "../bit-components";
import { paths } from "../systems/userinput/paths";
import { sets } from "../systems/userinput/sets";
import { getLastWorldPosition } from "../utils/three-utils";
import { Layers } from "./layers";

export function findRemoteHoverTarget(world, object3D) {
    if (!object3D) return null;
    if (!object3D.eid) return findRemoteHoverTarget(world, object3D.parent);
    if (hasComponent(world, NotRemoteHoverTarget, object3D.eid)) return null;
    if (hasComponent(world, RemoteHoverTarget, object3D.eid)) return object3D.eid;
    return findRemoteHoverTarget(world, object3D.parent);
}

const hoveredRightRemoteQuery = defineQuery([HoveredRemoteRight]);
const hoveredLeftRemoteQuery = defineQuery([HoveredRemoteLeft]);

const HIGHLIGHT = new THREE.Color("#6610f2");
const NO_HIGHLIGHT = new THREE.Color("#6f6ec4");

AFRAME.registerComponent("cursor-controller", {
    schema: {
        cursor: { type: "selector" },
        far: { default: 50 },
        near: { default: 0.01 },
        defaultDistance: { default: 4 },
        minDistance: { default: 0.18 }
    },

    init: function () {
        this.enabled = false;

        this.cursorVisual = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(),
            new THREE.ShaderMaterial({
                depthTest: false,
                uniforms: {
                    color: { value: new THREE.Color(0x2f80ed) }
                },
                vertexShader: `
          varying vec2 vPos;
          void main() {
            vPos = position.xy;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

            vec2 scale = vec2(
              length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) ),
              length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) )
            );

            float distance = -mvPosition.z;
            scale *= distance; // negates projection scale
            scale += min(1.0/distance, 0.3); // scale in screen space

            float radius = 0.02;
            mvPosition.xy += position.xy * radius * scale;
            gl_Position = projectionMatrix * mvPosition;
          }`,
                fragmentShader: `
          uniform vec3 color;
          varying vec2 vPos;

          void main() {
            float distance = length(vPos);
            if (distance > 0.5) {
                discard;
            }

            gl_FragColor = vec4(
              mix(color, vec3(0.0), step(0.35, distance)),
              0.8
            );

            // #include <tonemapping_fragment>
            #include <encodings_fragment>
          }`
            })
        );

        const setCursorScale = () => {
            this.cursorVisual.scale.setScalar(APP.store.state.preferences["cursorSize"] || 1);
            this.cursorVisual.matrixNeedsUpdate = true;
        };
        APP.store.addEventListener("statechanged", setCursorScale);
        setCursorScale();

        this.cursorVisual.renderOrder = window.APP.RENDER_ORDER.CURSOR;
        this.cursorVisual.material.transparent = true;
        this.cursorVisual.layers.set(Layers.CAMERA_LAYER_UI);
        this.data.cursor.object3D.add(this.cursorVisual);

        this.intersection = null;
        this.raycaster = new THREE.Raycaster();
        this.raycaster.firstHitOnly = true; // flag specific to three-mesh-bvh
        this.distance = this.data.far;
        this.color = this.cursorVisual.material.uniforms.color.value;
    },

    update: function () {
        this.raycaster.far = this.data.far;
        this.raycaster.near = this.data.near;
    },

    tick2: (() => {
        const rawIntersections = [];
        const v = new THREE.Vector3();

        return function (t, left) {
            const userinput = AFRAME.scenes[0].systems.userinput;
            const cursorPose = userinput.get(left ? paths.actions.cursor.left.pose : paths.actions.cursor.right.pose);
            this.data.cursor.object3D.visible = this.enabled && !!cursorPose;

            this.intersection = null;

            if (!this.enabled || !cursorPose) {
                return;
            }

            this.el.sceneEl.systems["hubs-systems"].characterController.avatarPOV.object3D.updateMatrices();
            const playerScale = v
                .setFromMatrixColumn(
                    this.el.sceneEl.systems["hubs-systems"].characterController.avatarPOV.object3D.matrixWorld,
                    1
                )
                .length();
            this.raycaster.far = this.data.far * playerScale;
            this.raycaster.near = this.data.near * playerScale;

            const isGrabbing = left
                ? anyEntityWith(APP.world, HeldRemoteLeft)
                : anyEntityWith(APP.world, HeldRemoteRight);
            let isHoveringSomething = false;
            if (!isGrabbing) {
                rawIntersections.length = 0;
                this.raycaster.ray.origin = cursorPose.position;
                this.raycaster.ray.direction = cursorPose.direction;
                this.raycaster.intersectObjects(
                    AFRAME.scenes[0].systems["hubs-systems"].cursorTargettingSystem.targets,
                    true,
                    rawIntersections
                );
                this.intersection = rawIntersections[0];

                const remoteHoverTarget =
                    this.intersection && findRemoteHoverTarget(APP.world, this.intersection.object);
                isHoveringSomething = !!remoteHoverTarget;
                if (remoteHoverTarget) {
                    addComponent(APP.world, left ? HoveredRemoteLeft : HoveredRemoteRight, remoteHoverTarget);
                }
                const hovered = left ? hoveredLeftRemoteQuery(APP.world) : hoveredRightRemoteQuery(APP.world);
                for (let i = 0; i < hovered.length; i++) {
                    // Unhover anything that should no longer be hovered
                    if (remoteHoverTarget !== hovered[i]) {
                        removeComponent(APP.world, left ? HoveredRemoteLeft : HoveredRemoteRight, hovered[i]);
                    }
                }
                this.distance = remoteHoverTarget
                    ? this.intersection.distance
                    : this.data.defaultDistance * playerScale;
            }

            const { cursor, minDistance, far } = this.data;

            const cursorModDelta =
                userinput.get(left ? paths.actions.cursor.left.modDelta : paths.actions.cursor.right.modDelta) || 0;
            if (
                isGrabbing &&
                !userinput.activeSets.includes(left ? sets.leftCursorHoldingUI : sets.rightCursorHoldingUI)
            ) {
                this.distance = THREE.MathUtils.clamp(this.distance - cursorModDelta, minDistance, far * playerScale);
            }

            if (isGrabbing || isHoveringSomething) {
                this.color.copy(HIGHLIGHT);
            } else {
                this.color.copy(NO_HIGHLIGHT);
            }

            cursor.object3D.position.copy(cursorPose.position).addScaledVector(cursorPose.direction, this.distance);
            // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
            cursor.object3D.matrixNeedsUpdate = true;
        };
    })()
});
