import { addComponent, removeComponent } from "bitecs";
import {
    RemoteRight,
    RemoteLeft,
    HandRight,
    HandLeft,
    RemoteHoverTarget,
    NotRemoteHoverTarget,
    Waypoint,
    RemoveNetworkedEntityButton,
    DestroyAtExtremeDistance
} from "./bit-components";

[
    ["remote-right", RemoteRight],
    ["remote-left", RemoteLeft],
    ["hand-right", HandRight],
    ["hand-left", HandLeft],
    // ["waypoint", Waypoint],
    ["is-remote-hover-target", RemoteHoverTarget],
    ["is-not-remote-hover-target", NotRemoteHoverTarget],
    ["remove-networked-object-button", RemoveNetworkedEntityButton],
    ["destroy-at-extreme-distances", DestroyAtExtremeDistance]
].forEach(([aframeComponentName, bitecsComponent]) => {
    AFRAME.registerComponent(aframeComponentName, {
        init: function () {
            addComponent(APP.world, bitecsComponent, this.el.object3D.eid);
        },
        remove: function () {
            removeComponent(APP.world, bitecsComponent, this.el.object3D.eid);
        }
    });
});
