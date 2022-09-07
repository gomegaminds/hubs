import React, { useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { TextInputField } from "../input/TextInputField";
import { useForm } from "react-hook-form";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { IconButton } from "../input/IconButton";
import Form from "react-bootstrap/Form";
import { ReactComponent as AttachIcon } from "../icons/Attach.svg";
import styles from "./ObjectUrlModal.scss";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";

export function ObjectUrlModal({ showModelCollectionLink, modelCollectionUrl, onSubmit, onClose }) {
    const { handleSubmit, register, watch, setValue } = useForm();

    useEffect(
        () => {
            register("url");
        },
        [register]
    );

    const file = watch("file");
    const hasFile = file && file.length > 0;
    const fileName = hasFile ? file[0].name : undefined;

    const onClear = useCallback(
        () => {
            if (hasFile) {
                setValue("file", undefined);
            } else {
                setValue("url", "");
            }
        },
        [hasFile, setValue]
    );

    const onChange = useCallback(
        (e) => {
            if (hasFile) {
                return;
            }

            setValue("url", e.target.value);
        },
        [hasFile, setValue]
    );

    const url = watch("url", "");

    const showCloseButton = hasFile || url.length > 0;

    return (
        <Modal
            title={<FormattedMessage id="object-url-modal.title" defaultMessage="Add Media to Room" />}
            beforeTitle={<CloseButton onClick={onClose} />}
        >
            <Column as="form" padding center onSubmit={handleSubmit(onSubmit)}>
                <p>
                    <FormattedMessage
                        id="object-url-modal.message-megaminds"
                        defaultMessage="Upload a file to your room by using an external link or a file from your computer."
                    />
                </p>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>External URL</Form.Label>
                    <Form.Control type="text" name="url" placeholder="example.com/image.png" onChange={onChange} />
                </Form.Group>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>From Computer</Form.Label>
                    <Form.Control type="file" name="file" ref={register} id="file" />
                </Form.Group>
                <Button type="submit" preset="accept">
                    <FormattedMessage id="object-url-modal.create-object-button" defaultMessage="Upload Media to Room" />
                </Button>
            </Column>
        </Modal>
    );
}

ObjectUrlModal.propTypes = {
    isMobile: PropTypes.bool,
    showModelCollectionLink: PropTypes.bool,
    modelCollectionUrl: PropTypes.string,
    onSubmit: PropTypes.func,
    onClose: PropTypes.func,
};
