import React, { useState, useEffect } from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import useTeacherProfile from "../auth/useTeacherProfile";
import { ExtendedModal } from "../room/Modal";

const initialSteps = {
    "avatar-moved": false,
    uploaded: false,
    "created-text": false,
    positioned: false,
    rotated: false,
    scaled: false,
    deleted: false,
};

export function OnboardingBox(props) {

    return (
        <ShepherdTour steps={newSteps} tourOptions={tourOptions}>
            <Button />
        </ShepherdTour>
    );
}

/*
                <div className="dash-card p-2">
                    <Card.Body>
                        <Card.Text>Welcome to the Classroom Editor</Card.Text>
                        <Card.Text>Below are some steps you can take to learn how the Classroom Editor workds.</Card.Text>
                    </Card.Body>
                    <Card.Body>
                        <ListGroup>
                            <ListGroup.Item
                                as="li"
                                className="d-flex justify-content-between align-items-start pt-3"
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">
                                        <span className="">
                                            Move your avatar
                                        </span>
                                        <span className="justify-content-end float-end">
                                            <i className="bi bi-question-circle-fill" />
                                        </span>
                                    </div>
                                    <p className="mt-2 mb-2">
                                        Before we delve into content, get a feel
                                        for the room.
                                    </p>
                                    <ul>
                                        <li>
                                            <i className="bi bi-square" />
                                            <span className="ms-2">
                                                {" "}
                                                Use the arrow keys or WASD to
                                                move.
                                            </span>
                                        </li>
                                        <li>
                                            <i className="bi bi-square" />
                                            <span className="ms-2">
                                                Click and drag the left mouse
                                                button to look around.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </ListGroup.Item>
                            <ListGroup.Item
                                as="li"
                                className="d-flex justify-content-between align-items-start pt-3"
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">
                                        <span className="ms-3" />
                                    </div>
                                    <p className="mt-2 mb-2">
                                        You should already have the
                                        Collaborative Maze Classroom in the not
                                        invite your students to a fun session?
                                    </p>
                                </div>
                            </ListGroup.Item>
                            <ListGroup.Item
                                as="li"
                                className="d-flex justify-content-between align-items-start pt-3"
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">
                                        <span className="ms-3">
                                            Get familiar with our resources
                                        </span>
                                    </div>
                                    <p className="mt-2 mb-2">
                                        Get familiar with assessments, Classroom
                                        Editor and more in our{" "}
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href="https://docs.megaminds.world/"
                                        >
                                            Resources
                                        </a>
                                    </p>
                                </div>
                            </ListGroup.Item>
                            <ListGroup.Item
                                as="li"
                                className="d-flex justify-content-between align-items-start pt-3"
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">
                                        <span className="ms-3">
                                            Restart the Onboarding Tutorial
                                        </span>
                                    </div>
                                    <p className="mt-2 mb-2">
                                        We explained the core concepts of 3D,
                                        MegaMinds and Education in the
                                        Onboarding flow. If you
                                    </p>
                                </div>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card.Body>
                </div>
                */
