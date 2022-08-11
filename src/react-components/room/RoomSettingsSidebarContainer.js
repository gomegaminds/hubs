import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { RoomSettingsSidebar } from "./RoomSettingsSidebar";
import configs from "../../utils/configs";
import { useInviteUrl } from "./useInviteUrl";

export function RoomSettingsSidebarContainer({ showBackButton, room, hubChannel, onChangeScene, onClose }) {
  const maxRoomSize = configs.feature("max_room_size");

  const { fetchingInvite, inviteUrl, revokeInvite } = useInviteUrl(hubChannel);

  const applyChanges = useCallback(
    settings => {

      // Going from voice to no voice 
      if(settings.user_data && !settings.user_data.toggle_voice && window.APP.hub.user_data && window.APP.hub.user_data.toggle_voice) {
	      console.log("Settings update triggered");
	      window.APP.hubChannel.sendMuteRequest();
      }

      // Going from no voice to voice 
      if(settings.user_data && settings.user_data.toggle_voice && window.APP.hub.user_data && !window.APP.hub.user_data.toggle_voice) {
	      console.log("Settings update triggered");
	      window.APP.hubChannel.sendUnMuteRequest();
      }

      hubChannel.updateHub(settings);

      onClose();
    },
    [hubChannel, onClose]
  );

  return (
    <RoomSettingsSidebar
      showBackButton={showBackButton}
      room={room}
      fetchingInvite={fetchingInvite}
      inviteUrl={inviteUrl}
      onRevokeInvite={revokeInvite}
      maxRoomSize={maxRoomSize}
      showPublicRoomSetting={hubChannel.canOrWillIfCreator("update_hub_promotion")}
      onSubmit={applyChanges}
      canChangeScene
      onChangeScene={onChangeScene}
      onClose={onClose}
    />
  );
}

RoomSettingsSidebarContainer.propTypes = {
  showBackButton: PropTypes.bool,
  room: PropTypes.object.isRequired,
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onChangeScene: PropTypes.func
};
