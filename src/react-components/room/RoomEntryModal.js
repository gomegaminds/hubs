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
import ClassRoomEntryModal from "../../mega-src/react-components/room/entry/ClassRoomEntryModal";
import SessionEntryModal from "../../mega-src/react-components/room/entry/SessionEntryModal";

export function RoomEntryModal({
    className,
    onJoinRoom,
    onForceJoinRoom,
    onSpectate,
    onSignInClick,
    isSignedIn,
    ...rest
}) {
    const breakpoint = useCssBreakpoints();
    const [loaded, setLoaded] = useState(false);

    const [step, setStep] = useState(0);

    const isEditingRoom = window.APP.editMode;


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
}

RoomEntryModal.propTypes = {
    className: PropTypes.string,
    onJoinRoom: PropTypes.func,
    onSpectate: PropTypes.func,
};
