import React, { useRef } from "react";
import PropTypes from "prop-types";
import styles from "./AudioPopover.scss";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { defineMessage, useIntl } from "react-intl";

import { useMicrophoneStatus } from "./useMicrophoneStatus";
import { useMicrophone } from "./useMicrophone";
import { useSpeakers } from "./useSpeakers";
import { useSound } from "./useSound";

import { FormattedMessage } from "react-intl";

const invitePopoverTitle = defineMessage({
    id: "audio-toolbar-popover.title",
    defaultMessage: "Audio Settings",
});

export const AudioPopoverButton = ({ initiallyVisible, content, micButton, scene }) => {
    const intl = useIntl();
    const title = intl.formatMessage(invitePopoverTitle);
    const popoverApiRef = useRef();

    const { isMicMuted, toggleMute, isMicEnabled } = useMicrophoneStatus(scene);
    const { micDeviceChanged, micDevices } = useMicrophone(scene);

    return (
        <Popover
            title={title}
            content={content}
            placement="top-start"
            offsetDistance={28}
            initiallyVisible={initiallyVisible}
            popoverApiRef={popoverApiRef}
        >
            {({ togglePopover, popoverVisible, triggerRef }) => (
                <div className={styles.buttonsContainer}>
                    <ToolbarButton
                        ref={triggerRef}
                        icon={isMicMuted || isMicEnabled ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
                        label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
                        tipTitle={"Toggle Microphone"}
                        tipBody={"Click to mute and unmute your microphone"}
                        preset={isMicMuted || !isMicEnabled ? "micoff" : "micon"}
                        onClick={toggleMute}
                        statusColor={isMicMuted || !isMicEnabled ? "disabled" : "enabled"}
                    />
                </div>
            )}
        </Popover>
    );
};

AudioPopoverButton.propTypes = {
    initiallyVisible: PropTypes.bool,
    content: PropTypes.element,
    micButton: PropTypes.element,
};
