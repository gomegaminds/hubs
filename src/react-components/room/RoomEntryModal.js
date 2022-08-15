import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as EnterIcon } from "../icons/Enter.svg";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as ShowIcon } from "../icons/Show.svg";
import { ReactComponent as SettingsIcon } from "../icons/Settings.svg";
import styles from "./RoomEntryModal.scss";
import styleUtils from "../styles/style-utils.scss";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { Column } from "../layout/Column";
import { AppLogo } from "../misc/AppLogo";
import { FormattedMessage } from "react-intl";
import { useAuth0 } from "@auth0/auth0-react";
import useTeacherProfile from "../../mega-src/react-components/auth/useTeacherProfile";

export function RoomEntryModal({
    className,
    roomName,
    showJoinRoom,
    onJoinRoom,
    onForceJoinRoom,
    showEnterOnDevice,
    onEnterOnDevice,
    showSpectate,
    onSpectate,
    onSignInClick,
    showOptions,
    onOptions,
    isSignedIn,
    ...rest
}) {
    const breakpoint = useCssBreakpoints();
    const [loaded, setLoaded] = useState(false);
    const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

    const [step, setStep] = useState(0);
    const [synced, setSynced] = useState(0);

    const isAuthenticatedAsTeacher = isAuthenticated;

    const [profile, isProfileLoading, isApiError, refresh] = useTeacherProfile(
        "teacherprofile",
        "read:teacher_profile",
        false
    );

    function populateSceneFromMozGLTF(scene) {
        document.querySelector("*[networked-counter]").setAttribute("networked-counter", { max: 100 });
        for (var node of scene.nodes) {
            console.log(node);
            var el = document.createElement("a-entity");
            AFRAME.scenes[0].appendChild(el);
            el.setAttribute("media-loader", {
                src: node.extensions.HUBS_components.media.src,
                fitToBox: true,
                resolve: true,
            });
            el.setAttribute("networked", { template: "#interactable-media" });
            if (node.translation) el.object3D.position.fromArray(node.translation);
            if (node.scale) el.object3D.scale.fromArray(node.scale);
            if (node.rotation) el.object3D.quaternion.fromArray(node.rotation);
            // somehow doesn't seem to be applied right, might be xyzw/wxyz or translating to origin first?

            window.NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
                window.APP.pinningHelper.setPinned(networkedEl, true);
            });
        }
        console.log("All", scene.nodes.length, "objects loaded");
    }

    const syncRoom = () => {
        fetch("https://megaminds.world/" + window.APP.hub.user_data.clone_source + "/objects.gltf")
            .then((response) => {
                return response.json();
            })
            .then((scene) => populateSceneFromMozGLTF(scene));

        let settings = window.APP.hub

        settings.user_data.clone_finished = true;

        window.APP.hubChannel.updateHub(settings);
        console.log("Trying to sync room");
    };

    const isEditingRoom = window.APP.hub.user_data && window.APP.hub.user_data.classroom;

    useEffect(() => {
        if (
            window.APP.hub.user_data &&
            window.APP.hub.user_data.clone_finished == false &&
            !window.APP.hub.user_data.classroom
        ) {
            syncRoom();
        } else {
            console.log("Room already synced");
        }
    }, []);
    useEffect(
        () => {
            if (profile && !loaded) {
                console.log("Got profile", profile);
                if (profile.setup == false) {
                    alert(
                        "You are logged in as a teacher, but you have not set up your profile yet. Please go to dash.megaminds.world and finish the setup before continuing as a teacher in the room."
                    );
                }
                if (profile.creatortoken) {
                    console.log("Signing in...");
                    window.APP.hubChannel.signIn(window.APP.store.state.credentials.token, profile.creatortoken);
                    console.log("Signed in, need to refresh hub?");
                }
                setLoaded(true);
            } else {
                console.log("Loading authentication", profile);
            }
        },
        [profile, isProfileLoading]
    );

    const handleLogin = () => {
        loginWithRedirect({ appState: { target: window.location.href } });
    };

    if (step == 1) {
        return (
            <Modal className={classNames(styles.roomEntryModal, className)} disableFullscreen {...rest}>
                <Column center className={styles.content}>
                    <div className={styles.roomName}>
                        <h5>
                            <FormattedMessage id="room-entry-modal.room-teacher-label" defaultMessage="Teacher Login" />
                        </h5>
                        <p>
                            <FormattedMessage
                                id="room-entry-modal.room-teacher-description"
                                defaultMessage="In order to use this room as a teacher, you must both sign in with your account, and verify your email. If any of the buttons below are clickable, it means you have not done all the steps."
                            />
                        </p>
                    </div>
                    <Column center className={styles.buttons}>
                        {!isAuthenticatedAsTeacher ? (
                            <Button preset="megamindsPurple" onClick={() => handleLogin()}>
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-button"
                                        defaultMessage="Teacher Login"
                                    />
                                </span>
                            </Button>
                        ) : (
                            <Button preset="success" disabled>
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-button-success"
                                        defaultMessage="Logged in"
                                    />
                                </span>
                            </Button>
                        )}
                        {!isSignedIn ? (
                            <Button preset="megamindsPurple" onClick={onSignInClick}>
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-verified"
                                        defaultMessage="Verify email"
                                    />
                                </span>
                            </Button>
                        ) : (
                            <Button preset="success" disabled>
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-verified-success"
                                        defaultMessage="Email verified"
                                    />
                                </span>
                            </Button>
                        )}
                        <Button preset="megamindsPurple" onClick={() => setStep(0)}>
                            <span>
                                <FormattedMessage id="room-entry-modal.teacher-login-back" defaultMessage="Back" />
                            </span>
                        </Button>
                    </Column>
                </Column>
            </Modal>
        );
    }

    if (step == 0) {
        return (
            <Modal className={classNames(styles.roomEntryModal, className)} disableFullscreen {...rest}>
                <Column center className={styles.content}>
                    {breakpoint !== "sm" &&
                        breakpoint !== "md" && (
                            <div className={styles.logoContainer}>
                                <AppLogo />
                            </div>
                        )}
                    <div className={styles.roomName}>
                        <h5>
                            {isEditingRoom ? (
                                <FormattedMessage id="room-entry-modal.room-name-label" defaultMessage="Room Name" />
                            ) : (
                                <FormattedMessage id="room-entry-modal.edit-name-label" defaultMessage="Editing Room" />
                            )}
                        </h5>
                        <p>{roomName}</p>
                    </div>
                    <Column center className={styles.buttons}>
                        {showJoinRoom && (
                            <Button preset="megamindsPurple" onClick={isEditingRoom ? onForceJoinRoom : onJoinRoom}>
                                <EnterIcon />
                                {isEditingRoom ? (
                                    <span>
                                        <FormattedMessage
                                            id="room-entry-modal.edit-room-button"
                                            defaultMessage="Edit Room"
                                        />
                                    </span>
                                ) : (
                                    <span>
                                        <FormattedMessage
                                            id="room-entry-modal.join-room-button"
                                            defaultMessage="Join Room"
                                        />
                                    </span>
                                )}
                            </Button>
                        )}
                        {showEnterOnDevice && (
                            <Button preset="megamindsPurple" onClick={onEnterOnDevice}>
                                <VRIcon />
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.enter-on-device-button"
                                        defaultMessage="Enter On Device"
                                    />
                                </span>
                            </Button>
                        )}
                        {showSpectate && !isEditingRoom && (
                            <Button preset="megamindsPurple" onClick={onSpectate}>
                                <ShowIcon />
                                <span>
                                    <FormattedMessage id="room-entry-modal.spectate-button" defaultMessage="Spectate" />
                                </span>
                            </Button>
                        )}
                        {(!isAuthenticatedAsTeacher || !isSignedIn) && (
                            <Button preset="megamindsPurple" onClick={() => setStep(1)}>
                                <ShowIcon />
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-button"
                                        defaultMessage="Teacher Login"
                                    />
                                </span>
                            </Button>
                        )}
                        {!isProfileLoading &&
                            profile && (
                                <>
                                    <span>
                                        Signed in as teacher {profile.first_name} {""} {profile.last_name}
                                    </span>
                                </>
                            )}
                    </Column>
                </Column>
            </Modal>
        );
    }
}

RoomEntryModal.propTypes = {
    className: PropTypes.string,
    roomName: PropTypes.string.isRequired,
    showJoinRoom: PropTypes.bool,
    onJoinRoom: PropTypes.func,
    showEnterOnDevice: PropTypes.bool,
    onEnterOnDevice: PropTypes.func,
    showSpectate: PropTypes.bool,
    onSpectate: PropTypes.func,
    onOptions: PropTypes.func,
};

RoomEntryModal.defaultProps = {
    showJoinRoom: true,
    showEnterOnDevice: true,
    showSpectate: true,
};
