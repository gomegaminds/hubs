import React, { useRef } from "react";
import PropTypes from "prop-types";
import styles from "./AudioPopover.scss";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import { defineMessage, useIntl } from "react-intl";

const invitePopoverTitle = defineMessage({
  id: "audio-toolbar-popover.title",
  defaultMessage: "Audio Settings"
});

export const AudioPopoverButton = ({ initiallyVisible, content, micButton }) => {
  const intl = useIntl();
  const title = intl.formatMessage(invitePopoverTitle);
  const popoverApiRef = useRef();

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
            ref={micButtonRef}
            icon={isMicrophoneMuted || !isMicrophoneEnabled ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
            label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
	    tipTitle={"Toggle Microphone"}
	    tipBody={"Click to mute and unmute your microphone"}
            preset={isMicrophoneMuted || !isMicrophoneEnabled ? "micoff" : "micon"}
	    edge="start"
            onClick={onChangeMicrophoneMuted}
            statusColor={isMicrophoneMuted || !isMicrophoneEnabled ? "disabled" : "enabled"}
          />
        </div>
      )}
    </Popover>
  );
};

AudioPopoverButton.propTypes = {
  initiallyVisible: PropTypes.bool,
  content: PropTypes.element,
  micButton: PropTypes.element
};
