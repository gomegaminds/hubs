import React, { useCallback, useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ImageGridPopover } from "../popover/ImageGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ReactionIcon } from "../icons/Reaction.svg";
import { ReactComponent as HandRaisedIcon } from "../icons/MegaMinds/HandRaised.svg";
import { ReactComponent as HandLoweredIcon } from "../icons/MegaMinds/HandLowered.svg";
import { defineMessage, FormattedMessage, useIntl } from "react-intl";
import { Column } from "../layout/Column";
import { Row } from "../layout/Row";
import { HandRaisedButton } from "./ReactionButton";
import styles from "./ReactionPopover.scss";
import { Button } from "../input/Button";

function usePresence(scene, initialPresence) {
  const [presence, setPresence] = useState(initialPresence);

  const onPresenceUpdate = ({ detail: presence }) => {
    if (presence.sessionId === NAF.clientId) setPresence(presence);
  };
  useEffect(
    () => {
      scene.addEventListener("presence_updated", onPresenceUpdate);
      return () => scene.removeEventListener("presence_updated", onPresenceUpdate);
    },
    [scene]
  );

  return presence;
}


const raiseHandTitle = defineMessage({
  id: "raisehand-popover.title",
  defaultMessage: "Raise"
});

const lowerHandTitle = defineMessage({
  id: "lowerhand-popover.title",
  defaultMessage: "Lower"
});

export function RaiseHandButton({ scene, initialPresence, ...rest }) {
  const presence = usePresence(scene, initialPresence);
  const intl = useIntl();
  const raiseTitle = intl.formatMessage(raiseHandTitle);
  const lowerTitle = intl.formatMessage(lowerHandTitle);

  const onToggleHandRaised = useCallback(
    () => {
      if (presence.hand_raised) {
        window.APP.hubChannel.lowerHand();
      } else {
        window.APP.hubChannel.raiseHand();
      }
    },
    [presence]
  );

  return (
        <ToolbarButton
          icon={
            presence.hand_raised ? (
              <HandRaisedIcon />
            ) : (
              <HandLoweredIcon />
            )
          }
          onClick={() => {
		  onToggleHandRaised();
	  }}
          label={presence.hand_raised ? lowerTitle : raiseTitle}
          preset="accent4"
        />
  );
}

