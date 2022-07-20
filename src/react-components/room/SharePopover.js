import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";
import { defineMessage, useIntl } from "react-intl";

const sharePopoverTitle = defineMessage({
  id: "share-popover.title",
  defaultMessage: "Share"
});

export function SharePopoverButton({ items }) {
  const intl = useIntl();
  const title = intl.formatMessage(sharePopoverTitle);

  const filteredItems = items.filter(item => !!item);

  // The button is removed if you can't share anything.
  if (filteredItems.length === 0) {
    return null;
  }

  const activeItem = filteredItems.find(item => item.active);

  // If there's one item to share (your smartphone camera), or an item is active (recording), then only show that button.
  if (filteredItems.length === 1 || activeItem) {
    const item = filteredItems[0];
    const Icon = item.icon;
    return (
      <ToolbarButton
        icon={<Icon />}
        onClick={() => {
          if (item.onSelect) {
            item.onSelect(item);
          }
        }}
        label={title}
        preset="accent1"
	edge="start"
        statusColor={activeItem && "recording"}
      />
    );
  }

  const itemList = filteredItems.map((item, i) => {
    const Icon = item.icon;
    return (
      <ToolbarButton
	key={item.id}
        icon={<Icon />}
        onClick={e => {
          if (item.onSelect) {
            item.onSelect(item);
	    e.target.blur();
          }
        }}
        label={title}
        tipTitle={item.tipTitle}
        tipBody={item.tipBody}
        preset="accent1"
	edge={i == 0 ? "start" : "middle"}
        statusColor={activeItem && "recording"}
      />
    );
  })

  return itemList;
}

SharePopoverButton.propTypes = {
  items: PropTypes.array.isRequired
};
