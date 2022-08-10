import React, { useState } from "react";
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

export function RoomEntryModal({
    className,
    roomName,
    showJoinRoom,
    onJoinRoom,
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
    const { isAuthenticated, loginWithRedirect } = useAuth0();

    const [step, setStep] = useState(0);

    const isAuthenticatedAsTeacher = isAuthenticated;

    if (step == 1) {
        return (
            <Modal className={classNames(styles.roomEntryModal, className)} disableFullscreen {...rest}>
                <Column center className={styles.content}>
                    <div className={styles.roomName}>
                        <h5>
                            <FormattedMessage id="room-entry-modal.room-teacher-label" defaultMessage="Teacher Login" />
                        </h5>
                    </div>
                    <Column center className={styles.buttons}>
                        {!isAuthenticatedAsTeacher ? (
                            <Button preset="megamindsPurple" onClick={() => loginWithRedirect()}>
                                <ShowIcon />
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-button"
                                        defaultMessage="Teacher Login"
                                    />
                                </span>
                            </Button>
                        ) : (
                            <Button preset="success" disabled>
                                <ShowIcon />
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-button-success"
                                        defaultMessage="Logged in"
                                    />
                                </span>
                            </Button>
                        )}
                        {!isSignedIn && (
                            <Button preset="megamindsPurple" onClick={onSignInClick}>
                                <ShowIcon />
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.teacher-login-verified"
                                        defaultMessage="Verify email"
                                    />
                                </span>
                            </Button>
                        )}
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
                            <FormattedMessage id="room-entry-modal.room-name-label" defaultMessage="Room Name" />
                        </h5>
                        <p>{roomName}</p>
                    </div>
                    <Column center className={styles.buttons}>
                        {showJoinRoom && (
                            <Button preset="megamindsPurple" onClick={onJoinRoom}>
                                <EnterIcon />
                                <span>
                                    <FormattedMessage
                                        id="room-entry-modal.join-room-button"
                                        defaultMessage="Join Room"
                                    />
                                </span>
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
                        {showSpectate && (
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
                        {showOptions &&
                            breakpoint !== "sm" && (
                                <>
                                    <hr className={styleUtils.showLg} />
                                    <Button preset="transparent" className={styleUtils.showLg} onClick={onOptions}>
                                        <SettingsIcon />
                                        <span>
                                            <FormattedMessage
                                                id="room-entry-modal.options-button"
                                                defaultMessage="Options"
                                            />
                                        </span>
                                    </Button>
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
    showOptions: PropTypes.bool,
    onOptions: PropTypes.func,
};

RoomEntryModal.defaultProps = {
    showJoinRoom: true,
    showEnterOnDevice: true,
    showSpectate: true,
    showOptions: true,
};
