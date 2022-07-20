import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Toolbar.scss";
import styleUtils from "../styles/style-utils.scss";
import ReactTooltip from 'react-tooltip';

const isMobile = AFRAME.utils.device.isMobile();

export function FakeToolbar({ className, left, center, right, ...rest }) {
  return (
    <div className={classNames(styles.faketoolbar, className)} {...rest}>
    </div>
  );
}


export function Toolbar({ className, left, center, right, ...rest }) {
  ReactTooltip.rebuild();

  const styleCenter = isMobile ? styles.leftContentMobile : styles.centerContent;
  const styleRight = isMobile ? styles.rightContentMobile : styles.rightContent;

  return (
    <div className={classNames(isMobile ? styles.toolbarPhone : styles.toolbar, className)} {...rest}>
      <ReactTooltip place="top" html={true} effect="solid" />
	  {!isMobile && (
		  <div className={classNames(styles.content, styles.leftContent)}>{left}</div>
	  )}
      <div className={classNames(styles.content, styleCenter)}>{center}</div>
      <div className={classNames(styles.content, styleRight)}>{right}</div>
    </div>
  );
}

Toolbar.propTypes = {
  className: PropTypes.string,
  left: PropTypes.node,
  center: PropTypes.node,
  right: PropTypes.node,
  hideLeft: PropTypes.string,
  hideRight: PropTypes.string
};
