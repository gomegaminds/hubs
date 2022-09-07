import React from "react";
import PropTypes from "prop-types";
import styles from "./RoomSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { InputField } from "../input/InputField";
import { IconButton } from "../input/IconButton";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { FormattedMessage, useIntl } from "react-intl";

function SceneAttribution({ attribution }) {
  const intl = useIntl();

  const unknown = intl.formatMessage({ id: "room-sidebar.unknown", defaultMessage: "unknown" });

  const name = attribution.name || attribution.title || unknown;
  const author = attribution.author || unknown;

  if (attribution.url) {
    const source = attribution.url.includes("sketchfab.com") ? "Sketchfab" : null;

    return (
      <li className={styles.attribution}>
        <div className={styles.attributionName}>
          <a href={attribution.url} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
        </div>
        <div className={styles.attributionAuthor}>
          {source ? (
            <FormattedMessage
              id="room-sidebar.scene-attribution-with-source"
              defaultMessage="by {author} on {source}"
              values={{
                author,
                source
              }}
            />
          ) : (
            <FormattedMessage
              id="room-sidebar.scene-attribution"
              defaultMessage="by {author}"
              values={{
                author
              }}
            />
          )}
        </div>
      </li>
    );
  } else if (attribution.author) {
    return (
      <li className={styles.attribution}>
        <div className={styles.attributionName}>{name}</div>
        <div className={styles.attributionAuthor}>
          <FormattedMessage
            id="room-sidebar.scene-attribution"
            defaultMessage="by {author}"
            values={{
              author
            }}
          />
        </div>
      </li>
    );
  } else {
    return null;
  }
}

// To assist with content control, we avoid displaying scene links to users who are not the scene
// creator, unless the scene is remixable or promotable.
function allowDisplayOfSceneLink(accountId, scene) {
  return scene && ((accountId && scene.account_id === accountId) || scene.allow_promotion || scene.allow_remixing);
}

export function RoomSidebar({ room, accountId, onClose, canEdit, onEdit, onChangeScene }) {
  return (
    <Sidebar
      title={<FormattedMessage id="room-sidebar.title" defaultMessage="Room" />}
      beforeTitle={<CloseButton onClick={onClose} />}
      afterTitle={
        canEdit && (
          <IconButton onClick={onEdit}>
            <FormattedMessage id="room-sidebar.edit-button" defaultMessage="Edit" />
          </IconButton>
        )
      }
    >
      <Column padding>
        <InputField label={<FormattedMessage id="room-sidebar.room-name" defaultMessage="Name" />}>
          {room.name}
        </InputField>
        {room.description && (
          <InputField label={<FormattedMessage id="room-sidebar.room-description" defaultMessage="Description" />}>
            {room.description}
          </InputField>
        )}
      </Column>
    </Sidebar>
  );
}

RoomSidebar.propTypes = {
  accountId: PropTypes.string,
  room: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  onChangeScene: PropTypes.func
};
