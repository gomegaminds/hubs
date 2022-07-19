import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ImageGridPopover } from "../popover/ImageGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ReactionIcon } from "../icons/MegaMinds/Smile.svg";
import { ReactComponent as HandRaisedIcon } from "../icons/HandRaised.svg";
import { defineMessage, FormattedMessage, useIntl } from "react-intl";
import { Column } from "../layout/Column";
import { Row } from "../layout/Row";
import { HandRaisedButton } from "./ReactionButton";
import styles from "./ReactionPopover.scss";
import { Button } from "../input/Button";

const reactionPopoverTitle = defineMessage({
  id: "reaction-popover.title",
  defaultMessage: "React"
});

function ReactionPopoverContent({ items, presence, onToggleHandRaised, ...rest }) {
  return (
    <Column padding="sm" grow gap="sm">
      <Row noWrap>
        <ImageGridPopover items={items} {...rest} />
      </Row>
    </Column>
  );
}

ReactionPopoverContent.propTypes = {
  items: PropTypes.array.isRequired,
  presence: PropTypes.object,
};


export function ReactionPopoverButton({ items, presence }) {
  const [isReactionsVisible, setIsReactionsVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const intl = useIntl();
  const title = intl.formatMessage(reactionPopoverTitle);
  const popoverApiRef = useRef();


  return (
    <Popover
      title={title}
      content={props => {
	      return(
          <ReactionPopoverContent
            items={items}
            presence={presence}
            {...props}
          />
	      );
      }}
      placement="top"
      offsetDistance={28}
      popoverApiRef={popoverApiRef}
      isVisible={isReactionsVisible}
      onChangeVisible={visible => {
        if (!visible) {
          setIsReactionsVisible(false);
        }
      }}
      disableFullscreen={isTooltipVisible}
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<ReactionIcon />}
          selected={popoverVisible}
          onClick={() => {
		  setIsReactionsVisible(!isReactionsVisible);
		  togglePopover();
          }}
          label={title}
          preset="accent1"
	  edge="end"
	  tipTitle={"Reactions"}
	  tipBody={"Spawn emojis in front of your avatar"}
        />
      )}
    </Popover>
  );
}

ReactionPopoverButton.propTypes = {
  items: PropTypes.array.isRequired,
  presence: PropTypes.object,
};
