import React, { useEffect, useRef, forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { ReactComponent as AttachIcon } from "../icons/Attach.svg";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { ReactComponent as SendIcon } from "../icons/Send.svg";
import { ReactComponent as ReactionIcon } from "../icons/Reaction.svg";
import { IconButton } from "../input/IconButton";
import { TextAreaInput } from "../input/TextAreaInput";
import { ToolbarButton } from "../input/ToolbarButton";
import styles from "./ChatSidebar.scss";
import { formatMessageBody } from "../../utils/chat-message";
import { FormattedMessage, useIntl, defineMessages, FormattedRelativeTime } from "react-intl";


const enteredMessages = defineMessages({
    room: { id: "chat-sidebar.system-message.entered-room", defaultMessage: "{name} entered the room." },
    lobby: { id: "chat-sidebar.system-message.entered-lobby", defaultMessage: "{name} entered the lobby." },
});

const joinedMessages = defineMessages({
    lobby: { id: "chat-sidebar.system-message.joined-lobby", defaultMessage: "{name} joined the lobby." },
    room: { id: "chat-sidebar.system-message.joined-room", defaultMessage: "{name} joined the room." },
});

export const LogMessageType = {
    roomEntryRequired: "roomEntryRequired",
    flyModeDisabled: "flyModeDisabled",
    flyModeEnabled: "flyModeEnabled",
    unauthorizedSceneChange: "unauthorizedSceneChange",
    invalidSceneUrl: "invalidSceneUrl",
    unauthorizedRoomRename: "unauthorizedRoomRename",
    captureUnavailable: "captureUnavailable",
    captureStopped: "captureStopped",
    captureStarted: "captureStarted",
    captureAlreadyStopped: "captureAlreadyStopped",
    captureAlreadyRunning: "captureAlreadyRunning",
    positionalAudioEnabled: "positionalAudioEnabled",
    positionalAudioDisabled: "positionalAudioDisabled",
    setAudioNormalizationFactor: "setAudioNormalizationFactor",
    audioNormalizationDisabled: "audioNormalizationDisabled",
    audioNormalizationNaN: "audioNormalizationNaN",
    invalidAudioNormalizationRange: "invalidAudioNormalizationRange",
    audioSuspended: "audioSuspended",
    audioResumed: "audioResumed",
    joinFailed: "joinFailed",
    avatarChanged: "avatarChanged",
};

const logMessages = defineMessages({
    [LogMessageType.roomEntryRequired]: {
        id: "chat-sidebar.log-message.room-entry-required",
        defaultMessage: "You must enter the room to use this command.",
    },
    [LogMessageType.flyModeDisabled]: {
        id: "chat-sidebar.log-message.fly-mode-disabled",
        defaultMessage: "Fly mode disabled.",
    },
    [LogMessageType.flyModeEnabled]: {
        id: "chat-sidebar.log-message.fly-mode-enabled",
        defaultMessage: "Fly mode enabled.",
    },
    [LogMessageType.unauthorizedSceneChange]: {
        id: "chat-sidebar.log-message.unauthorized-scene-change",
        defaultMessage: "You do not have permission to change the scene.",
    },
    [LogMessageType.invalidSceneUrl]: {
        id: "chat-sidebar.log-message.invalid-scene-url",
        defaultMessage: "This URL does not point to a scene or valid GLB.",
    },
    [LogMessageType.unauthorizedRoomRename]: {
        id: "chat-sidebar.log-message.unauthorized-room-rename",
        defaultMessage: "You do not have permission to rename this room.",
    },
    [LogMessageType.captureUnavailable]: {
        id: "chat-sidebar.log-message.capture-unavailable",
        defaultMessage: "Capture unavailable.",
    },
    [LogMessageType.captureStopped]: {
        id: "chat-sidebar.log-message.capture-stopped",
        defaultMessage: "Capture stopped.",
    },
    [LogMessageType.captureStarted]: {
        id: "chat-sidebar.log-message.capture-started",
        defaultMessage: "Capture started.",
    },
    [LogMessageType.captureAlreadyStopped]: {
        id: "chat-sidebar.log-message.capture-already-stopped",
        defaultMessage: "Capture already stopped.",
    },
    [LogMessageType.captureAlreadyRunning]: {
        id: "chat-sidebar.log-message.capture-already-running",
        defaultMessage: "Capture already running.",
    },
    [LogMessageType.positionalAudioEnabled]: {
        id: "chat-sidebar.log-message.positional-audio-enabled",
        defaultMessage: "Positional audio enabled.",
    },
    [LogMessageType.positionalAudioDisabled]: {
        id: "chat-sidebar.log-message.positional-audio-disabled",
        defaultMessage: "Positional audio disabled.",
    },
    [LogMessageType.setAudioNormalizationFactor]: {
        id: "chat-sidebar.log-message.set-audio-normalization-factor",
        defaultMessage: "audioNormalization factor is set to {factor}.",
    },
    [LogMessageType.audioNormalizationDisabled]: {
        id: "chat-sidebar.log-message.audio-normalization-disabled",
        defaultMessage: "audioNormalization is disabled.",
    },
    [LogMessageType.audioNormalizationNaN]: {
        id: "chat-sidebar.log-message.audio-normalization-nan",
        defaultMessage: "audioNormalization command needs a valid number parameter.",
    },
    [LogMessageType.invalidAudioNormalizationRange]: {
        id: "chat-sidebar.log-message.invalid-audio-normalization-range",
        defaultMessage:
            "audioNormalization command needs a base volume number between 0 [no normalization] and 255. Default is 0. The recommended value is 4, if you would like to enable normalization.",
    },
    [LogMessageType.audioSuspended]: {
        id: "chat-sidebar.log-message.audio-suspended",
        defaultMessage: "Audio has been suspended, click somewhere in the room to resume the audio.",
    },
    [LogMessageType.audioResumed]: {
        id: "chat-sidebar.log-message.audio-resumed",
        defaultMessage: "Audio has been resumed.",
    },
    [LogMessageType.joinFailed]: {
        id: "chat-sidebar.log-message.join-failed",
        defaultMessage: "Failed to join room: {message}",
    },
    [LogMessageType.avatarChanged]: {
        id: "chat-sidebar.log-message.avatar-changed",
        defaultMessage: "Your avatar has been changed.",
    },
});

// TODO: use react-intl's defineMessages to get proper extraction
export function formatSystemMessage(entry, intl) {
    if(entry.name === "teacher_bot_2df") {
        return null;
    }

    switch (entry.type) {
        case "join":
            return intl.formatMessage(joinedMessages[entry.presence], { name: <b>{entry.name}</b> });
        case "entered":
            return intl.formatMessage(enteredMessages[entry.presence], { name: <b>{entry.name}</b> });
        case "leave":
            return (
                <FormattedMessage
                    id="chat-sidebar.system-message.leave"
                    defaultMessage="{name} left."
                    values={{ name: <b>{entry.name}</b> }}
                />
            );
        case "display_name_changed":
            return (
                <FormattedMessage
                    id="chat-sidebar.system-message.name-change"
                    defaultMessage="{newName} is joining the room"
                    values={{ newName: <b>{entry.newName}</b> }}
                />
            );
        case "hub_changed":
            return (
                <FormattedMessage
                    id="chat-sidebar.system-message.hub-change"
                    defaultMessage="You are now in {hubName}"
                    values={{ hubName: <b>{entry.hubName}</b> }}
                />
            );
        case "log":
            return intl.formatMessage(logMessages[entry.messageType], entry.props);
        default:
            return null;
    }
}


function getMessageComponent(message) {
    switch (message.type) {
        case "chat": {
            const { formattedBody, monospace, emoji } = formatMessageBody(message.body);
            return (
                <MessageBubble key={message.id} monospace={monospace} emoji={emoji}>
                    {formattedBody}
                </MessageBubble>
            );
        }
        case "video":
            return (
                <MessageBubble key={message.id} media>
                    <video controls src={message.body.src} />
                </MessageBubble>
            );
        case "image":
        case "photo":
            return (
                <MessageBubble key={message.id} media>
                    <img src={message.body.src} />
                </MessageBubble>
            );
        default:
            return null;
    }
}
