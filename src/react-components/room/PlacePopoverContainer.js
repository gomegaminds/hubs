import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
// import { ReactComponent as PenIcon } from "../icons/Pen.svg";
import { ReactComponent as CameraIcon } from "../icons/Camera.svg";
// import { ReactComponent as TextIcon } from "../icons/Text.svg";
// import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GIFIcon } from "../icons/MegaMinds/FindImages.svg";
import { ReactComponent as ObjectIcon } from "../icons/MegaMinds/FindModels.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as SceneIcon } from "../icons/Scene.svg";
import { ReactComponent as UploadIcon } from "../icons/MegaMinds/UploadOwn.svg";
import { PlacePopoverButton } from "./PlacePopover";
import { ObjectUrlModalContainer } from "./ObjectUrlModalContainer";
import configs from "../../utils/configs";
import { FormattedMessage } from "react-intl";
import { anyEntityWith } from "../../utils/bit-utils";
import { MyCameraTool } from "../../bit-components";

export function PlacePopoverContainer({ scene, mediaSearchStore, showNonHistoriedDialog, hubChannel }) {
  const [items, setItems] = useState([]);

  useEffect(
    () => {
      function updateItems() {
        const hasActiveCamera = !!anyEntityWith(APP.world, MyCameraTool);
        const hasActivePen = !!scene.systems["pen-tools"].getMyPen();

	let nextItems = [
            configs.integration("tenor") && {
              id: "gif",
              icon: GIFIcon,
              color: "accent2",
              label: <FormattedMessage id="place-popover.item-type.gif" defaultMessage="Find GIF" />,
              onSelect: () => mediaSearchStore.sourceNavigate("gifs")
            },
            configs.integration("sketchfab") && {
              id: "model",
              icon: ObjectIcon,
              color: "accent2",
              label: <FormattedMessage id="place-popover.item-type.model" defaultMessage="Find Model" />,
              onSelect: () => mediaSearchStore.sourceNavigate("sketchfab")
            },
            {
              id: "upload",
              icon: UploadIcon,
              color: "accent3",
              label: <FormattedMessage id="place-popover.item-type.upload" defaultMessage="Upload" />,
              onSelect: () => showNonHistoriedDialog(ObjectUrlModalContainer, { scene })
            }
	];

        setItems(nextItems);
      }

      hubChannel.addEventListener("permissions_updated", updateItems);

      updateItems();

      function onSceneStateChange(event) {
        if (event.detail === "camera" || event.detail === "pen") {
          updateItems();
        }
      }

      scene.addEventListener("stateadded", onSceneStateChange);
      scene.addEventListener("stateremoved", onSceneStateChange);

      return () => {
        hubChannel.removeEventListener("permissions_updated", updateItems);
        scene.removeEventListener("stateadded", onSceneStateChange);
        scene.removeEventListener("stateremoved", onSceneStateChange);
      };
    },
    [hubChannel, mediaSearchStore, showNonHistoriedDialog, scene]
  );

  return <PlacePopoverButton items={items} />;
}

PlacePopoverContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  mediaSearchStore: PropTypes.object.isRequired,
  showNonHistoriedDialog: PropTypes.func.isRequired
};
