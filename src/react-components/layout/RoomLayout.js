import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./RoomLayout.scss";
import { Toolbar, FakeToolbar } from "./Toolbar";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export function RoomLayout({
    className,
    viewportClassName,
    sidebar,
    sidebarClassName,
    toolbarLeft,
    toolbarCenter,
    toolbarRight,
    toolbarClassName,
    modal,
    viewport,
    objectFocused,
    streaming,
    viewportRef,
    entered,
    ...rest
}) {
    return (
        <div ref={viewportRef} className="roomlayout">
            {(toolbarLeft || toolbarCenter || toolbarRight) &&
                entered && (
                    <Row className="fixed-bottom toolbar d-flex justify-content-between">
                        <Col className="d-flex justify-content-start toolbarGroup">{toolbarLeft}</Col>
                        <Col className="d-flex justify-content-middle toolbarGroup">{toolbarCenter}</Col>
                        <Col className="d-flex justify-content-end toolbarGroup">{toolbarRight}</Col>
                    </Row>
                )}
            {viewport}
        </div>
    );
}

RoomLayout.propTypes = {
    className: PropTypes.string,
    viewportClassName: PropTypes.string,
    sidebar: PropTypes.node,
    sidebarClassName: PropTypes.string,
    toolbarLeft: PropTypes.node,
    toolbarCenter: PropTypes.node,
    toolbarRight: PropTypes.node,
    toolbarClassName: PropTypes.string,
    modal: PropTypes.node,
    viewport: PropTypes.node,
    objectFocused: PropTypes.bool,
    streaming: PropTypes.bool,
    viewportRef: PropTypes.any,
};
