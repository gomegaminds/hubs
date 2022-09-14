import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as EnterIcon } from "../icons/Enter.svg";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as ShowIcon } from "../icons/Show.svg";
import { ReactComponent as SettingsIcon } from "../icons/Settings.svg";
import { syncRoom } from "../../mega-src/utils/cloning-utils";
import styles from "./RoomEntryModal.scss";
import styleUtils from "../styles/style-utils.scss";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { Column } from "../layout/Column";
import { AppLogo } from "../misc/AppLogo";
import { FormattedMessage } from "react-intl";
import { useAuth0 } from "@auth0/auth0-react";
import useTeacherProfile from "../../mega-src/react-components/auth/useTeacherProfile";
import ClassRoomEntryModal from "../../mega-src/react-components/room/ClassRoomEntryModal";
import SessionEntryModal from "../../mega-src/react-components/room/SessionEntryModal";

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

    const isEditingRoom = window.APP.hub.user_data && window.APP.hub.user_data.classroom;

    useEffect(() => {
        if (
            window.APP.hub.user_data && !window.APP.hub.user_data.classroom && isAuthenticatedAsTeacher
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
                if (profile.first_name) {
                    window.APP.store.update({
                        profile: {
                            displayName: profile.first_name + " " + profile.last_name,
                        },
                    });
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

    if (isEditingRoom) {
        return (
            <ClassRoomEntryModal
                isSignedIn={isSignedIn}
                forceJoinRoom={onForceJoinRoom}
                onSignInClick={onSignInClick}
            />
        );
    } else {
        return (
            <SessionEntryModal
                onJoinRoom={onJoinRoom}
                isSignedIn={isSignedIn}
                forceJoinRoom={onForceJoinRoom}
                onSignInClick={onSignInClick}
            />
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
                        {showSpectate &&
                            !isEditingRoom && (
                                <Button preset="megamindsPurple" onClick={onSpectate}>
                                    <ShowIcon />
                                    <span>
                                        <FormattedMessage
                                            id="room-entry-modal.spectate-button"
                                            defaultMessage="Spectate"
                                        />
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
