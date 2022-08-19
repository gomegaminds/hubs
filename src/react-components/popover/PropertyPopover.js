import React, { useState, useCallback, useEffect } from "react";
// Note react-popper-2 is just an alias to react-popper@2.2.3 because storybook is depending on an old version.
// https://github.com/storybookjs/storybook/issues/10982
import { usePopper } from "react-popper-2";
import styles from "./Popover.scss";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import classNames from "classnames";
import { CloseButton } from "../input/CloseButton";

export function PropertyPopover({
  content: Content,
  children,
  title,
  showHeader,
  placement,
  offsetSkidding,
  offsetDistance,
  initiallyVisible,
  disableFullscreen,
  isVisible,
  onChangeVisible,
  popoverApiRef,
  popoverClass,
}) {
  const [_visible, _setVisible] = useState(initiallyVisible);
  const visible = isVisible === undefined ? _visible : isVisible;
  const setVisible = onChangeVisible || _setVisible;
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const {
    styles: { popper: popperStyles },
    attributes
  } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      { name: "offset", options: { offset: [offsetSkidding, offsetDistance] } } // https://popper.js.org/docs/v2/modifiers/offset/
    ]
  });
  const breakpoint = useCssBreakpoints();
  const fullscreen = !disableFullscreen && (breakpoint === "sm" || breakpoint === "md");
  const openPopover = useCallback(() => setVisible(true), [setVisible]);
  const closePopover = useCallback(() => setVisible(false), [setVisible]);
  const togglePopover = useCallback(() => setVisible(visible => !visible), [setVisible]);

  useEffect(
    () => {
      if (!popoverApiRef) {
        return;
      }

      popoverApiRef.current = {
        openPopover,
        closePopover,
        togglePopover
      };
    },
    [popoverApiRef, openPopover, closePopover, togglePopover]
  );

  useEffect(
    () => {
      const onClick = e => {
        if (
          (referenceElement && referenceElement.contains(e.target)) ||
          (popperElement && popperElement.contains(e.target))
        ) {
          return;
        }

        setVisible(false);
      };

      const onKeyDown = e => {
        if (e.key === "Escape") {
          setVisible(false);
        }
      };

      if (visible) {
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKeyDown);
      }

      return () => {
        window.removeEventListener("mousedown", onClick);
        window.removeEventListener("keydown", onKeyDown);
      };
    },
    [visible, popperElement, referenceElement, setVisible]
  );

  useEffect(
    () => {
      if (visible && fullscreen) {
        document.body.classList.add(styles.fullscreenBody);
      } else {
        document.body.classList.remove(styles.fullscreenBody);
      }

      return () => {
        document.body.classList.remove(styles.fullscreenBody);
      };
    },
    [fullscreen, visible]
  );

  return (
    <>
      {children({
        togglePopover,
        openPopover,
        closePopover,
        popoverVisible: visible,
        triggerRef: setReferenceElement
      })}
      {visible &&
        createPortal(
          <div
            ref={setPopperElement}
            className={classNames(styles.popoverProperties, { [styles.fullscreen]: fullscreen }, popoverClass)}
            style={fullscreen ? undefined : popperStyles}
            {...attributes.popper}
          >
            {showHeader && (
              <div className={styles.header}>
                <CloseButton onClick={closePopover} />
                <h5>{title}</h5>
              </div>
            )}
            <div className={styles.content}>
              {typeof Content === "function" ? (
                <Content fullscreen={fullscreen} closePopover={closePopover} />
              ) : (
                Content
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

PropertyPopover.propTypes = {
  initiallyVisible: PropTypes.bool,
  placement: PropTypes.string,
  title: PropTypes.node.isRequired,
  children: PropTypes.func.isRequired,
  content: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  disableFullscreen: PropTypes.bool,
  popoverApiRef: PropTypes.object,
  popoverClass: PropTypes.string
};

PropertyPopover.defaultProps = {
  initiallyVisible: false,
  placement: "auto",
  offsetSkidding: 0,
  offsetDistance: 8,
  showHeader: true
};
