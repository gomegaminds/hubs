import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { injectIntl } from "react-intl";
import { formatSystemMessage } from "./room/ChatSidebar";

import ChatMessage from "./chat-message";
import PhotoMessage from "./photo-message";
import VideoMessage from "./video-message";
import ImageMessage from "./image-message";
import { getPresenceContextForSession } from "../utils/phoenix-utils";

class PresenceLog extends Component {
    static propTypes = {
        entries: PropTypes.array,
        inRoom: PropTypes.bool,
        hubId: PropTypes.string,
        history: PropTypes.object,
        presences: PropTypes.object,
        onViewProfile: PropTypes.func,
        intl: PropTypes.object,
    };

    constructor(props) {
        super(props);
    }

    domForEntry = (e) => {
        const presenceContext = e.sessionId ? getPresenceContextForSession(this.props.presences, e.sessionId) : {};
        const isBot = !!presenceContext.discord;

        switch (e.type) {
            case "chat":
                return (
                    <ChatMessage
                        key={e.key}
                        name={e.name}
                        body={e.body}
                        maySpawn={e.maySpawn}
                        sessionId={e.sessionId}
                        includeFromLink={this.props.inRoom && !isBot}
                        history={this.props.history}
                        onViewProfile={this.props.onViewProfile}
                    />
                );
            case "image":
                return <ImageMessage key={e.key} name={e.name} body={e.body} maySpawn={e.maySpawn} />;
            case "photo":
                return (
                    <PhotoMessage
                        key={e.key}
                        name={e.name}
                        body={e.body}
                        maySpawn={e.maySpawn}
                        hubId={this.props.hubId}
                    />
                );
            case "video":
                return (
                    <VideoMessage
                        key={e.key}
                        name={e.name}
                        body={e.body}
                        maySpawn={e.maySpawn}
                        hubId={this.props.hubId}
                    />
                );
            default: {
                const systemMessage = formatSystemMessage(e, this.props.intl);

                return (
                    systemMessage && (
                        <div key={e.key}>
                            <div>{systemMessage}</div>
                        </div>
                    )
                );
            }
        }
    };

    render() {
        return <div>{this.props.entries.map(this.domForEntry)}</div>;
    }
}

export default injectIntl(PresenceLog);
