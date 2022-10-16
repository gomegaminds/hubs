import React from "react";
import PropTypes from "prop-types";
import { TextInputField } from "./TextInputField";
import { Button } from "./Button";
import styles from "./CopyableTextInputField.scss";
import { defineMessage, useIntl } from "react-intl";

const copyLabelMessage = defineMessage({
  id: "copyable-text-input-field.copy-label",
  defaultMessage: "Copy"
});

const copiedLabelMessage = defineMessage({
  id: "copyable-text-input-field.copied-label",
  defaultMessage: "Copied"
});

export function CopyableTextInputField({ buttonPreset, ...rest }) {

    const textRef = useRef();

    const intl = useIntl();

    const copyToClipboard = (e) => {
        navigator.clipboard.writeText(textRef.current);
    }

  const copyLabel = intl.formatMessage(copyLabelMessage);
  const copiedLabel = intl.formatMessage(copiedLabelMessage);

  // Use a dynamic width based on the content to account for i18n
  const maxLabelLength = Math.max(copyLabel.length, copiedLabel.length);

  return (
    <TextInputField
      ref={textRef.current}
      afterInput={
          <Button
            preset={buttonPreset}
            onClick={e => copyToClipboard.copy}
            className={styles.copyButton}
            style={{ width: `${maxLabelLength}ch` }} // ch is a unit representing the width of the 0 character
          >
            {clipboard.copied ? copiedLabel : copyLabel}
          </Button>
      }
      {...rest}
    />
  );
}

CopyableTextInputField.propTypes = {
  buttonPreset: PropTypes.string
};
