import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as ObjectIcon } from "../icons/MegaMinds/Media.svg";
import { defineMessage, useIntl } from "react-intl";

const placePopoverTitle = defineMessage({
    id: "place-popover.title",
    defaultMessage: "Add Media",
});

export function PlacePopoverButton({ items }) {
    const intl = useIntl();
    const filteredItems = items.filter((item) => !!item);

    const title = intl.formatMessage(placePopoverTitle);

    return (
        <Popover
            title={title}
            content={(props) => <ButtonGridPopover items={filteredItems} {...props} />}
            placement="top"
            offsetDistance={28}
        >
            {({ togglePopover, popoverVisible, triggerRef }) => (
                <ToolbarButton
                    ref={triggerRef}
                    icon={<ObjectIcon />}
                    selected={popoverVisible}
                    onClick={togglePopover}
                    label={title}
                    tipTitle={"Add media"}
                    tipBody={
                        "Add media such as images, documents, and much more."
                    }
                    preset="accent1"
                />
            )}
        </Popover>
    );
}

PlacePopoverButton.propTypes = {
    items: PropTypes.array.isRequired,
};
