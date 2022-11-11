import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

const ChatContext = createContext({ messageGroups: [], sendMessage: () => {} });

let uniqueMessageId = 0;

const NEW_MESSAGE_GROUP_TIMEOUT = 1000 * 60;

function shouldCreateNewMessageGroup(messageGroups, newMessage, now) {
  if (messageGroups.length === 0) {
    return true;
  }

  const lastMessageGroup = messageGroups[messageGroups.length - 1];

  if (lastMessageGroup.senderSessionId !== newMessage.sessionId) {
    return true;
  }

  const lastMessage = lastMessageGroup.messages[lastMessageGroup.messages.length - 1];

  return now - lastMessage.timestamp > NEW_MESSAGE_GROUP_TIMEOUT;
}

function processChatMessage(messageGroups, newMessage) {
  const now = Date.now();
  const { name, sent, sessionId, ...messageProps } = newMessage;

  if (shouldCreateNewMessageGroup(messageGroups, newMessage, now)) {
    return [
      ...messageGroups,
      {
        id: uniqueMessageId++,
        timestamp: now,
        sent,
        sender: name,
        senderSessionId: sessionId,
        messages: [{ id: uniqueMessageId++, timestamp: now, ...messageProps }]
      }
    ];
  }

  const lastMessageGroup = messageGroups.pop();
  lastMessageGroup.messages = [
    ...lastMessageGroup.messages,
    { id: uniqueMessageId++, timestamp: now, ...messageProps }
  ];

  return [...messageGroups, { ...lastMessageGroup }];
}

// Returns the new message groups array when we receive a message.
// If the message is ignored, we return the original message group array.
function updateMessageGroups(messageGroups, newMessage) {
  switch (newMessage.type) {
    case "join":
    case "entered":
    case "leave":
    case "display_name_changed":
    case "scene_changed":
    case "hub_name_changed":
    case "hub_changed":
    case "log":
      return [
        ...messageGroups,
        {
          id: uniqueMessageId++,
          systemMessage: true,
          timestamp: Date.now(),
          ...newMessage
        }
      ];
    case "chat":
    case "image":
    case "photo":
    case "video":
      return processChatMessage(messageGroups, newMessage);
    default:
      return messageGroups;
  }
}

export function ChatContextProvider({ messageDispatch, children }) {
  const [messageGroups, setMessageGroups] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(false);

  useEffect(
    () => {
      function onReceiveMessage(event) {
        const newMessage = event.detail;
        setMessageGroups(messages => updateMessageGroups(messages, newMessage));

        if (
          newMessage.type === "chat" ||
          newMessage.type === "image" ||
          newMessage.type === "photo" ||
          newMessage.type === "video"
        ) {
          setUnreadMessages(true);
        }
      }

      if (messageDispatch) {
        messageDispatch.addEventListener("message", onReceiveMessage);
      }

      return () => {
        if (messageDispatch) {
          messageDispatch.removeEventListener("message", onReceiveMessage);
        }
      };
    },
    [messageDispatch, setMessageGroups, setUnreadMessages]
  );

  const sendMessage = useCallback(
    message => {
      if (messageDispatch) {
        messageDispatch.dispatch(message);
      }
    },
    [messageDispatch]
  );

  const setMessagesRead = useCallback(
    () => {
      setUnreadMessages(false);
    },
    [setUnreadMessages]
  );

  return (
    <ChatContext.Provider value={{ messageGroups, unreadMessages, sendMessage, setMessagesRead }}>
      {children}
    </ChatContext.Provider>
  );
}

ChatContextProvider.propTypes = {
  children: PropTypes.node,
  messageDispatch: PropTypes.object
};
