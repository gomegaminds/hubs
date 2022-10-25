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
import useTeacherProfile from "../../mega-src/react-components/auth/useTeacherProfile";
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

    const [profile, isProfileLoading, isError, refresh] = useTeacherProfile(
        "teacherprofile",
        "read:teacher_profile",
        false
    );

    const isEditingRoom = window.APP.editMode;

    useEffect(
        () => {
            if (!isProfileLoading && !isError && profile) {
                if (profile.setup == false) {
                    alert(
                        "You are logged in as a teacher, but you have not set up your profile yet. Please go to dash.megaminds.world and finish the setup before continuing as a teacher in the room."
                    );
                }
                if (profile.creatortoken) {
                    console.log("CREATOR TOKEN");
                    window.APP.hubChannel.signIn(profile.reticulum_token, profile.creatortoken);
                }
                setLoaded(true);
            } else {
                console.log("No profile found after loading", profile);
                setLoaded(true);
            }
        },
        [profile, isProfileLoading, isError]
    );

    if (!loaded) {
        return <p>Loading...</p>;
    }

    if (!profile && isEditingRoom) {
        return <p>Loading...</p>;
    }

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
