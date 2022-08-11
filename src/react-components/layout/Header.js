import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import maskEmail from "../../utils/mask-email";
import styles from "./Header.scss";
import { Container } from "./Container";
import { SocialBar } from "../home/SocialBar";
import { SignInButton } from "../home/SignInButton";
import { AppLogo } from "../misc/AppLogo";

export function Header({
  showCloud,
  enableSpoke,
  editorName,
  showDocsLink,
  docsUrl,
  showSourceLink,
  showCommunityLink,
  communityUrl,
  isAdmin,
  isSignedIn,
  email,
  onSignOut,
  isHmc
}) {
  return (
    <header>
      <Container as="div" className={styles.container}>
        <nav>
          <ul>
            <li>
              <a href="/" className={styles.homeLink}>
                {/*
                This forceConfigurableLogo prop is a bit of a hack, since we want the home page on HMC to use our 
                configured logo, which is left-aligned, as opposed to the logo that we typically used for HMC, 
                which is center-aligned.
                */}
                <AppLogo forceConfigurableLogo />
              </a>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}

Header.propTypes = {
  showCloud: PropTypes.bool,
  enableSpoke: PropTypes.bool,
  editorName: PropTypes.string,
  showDocsLink: PropTypes.bool,
  docsUrl: PropTypes.string,
  showSourceLink: PropTypes.bool,
  showCommunityLink: PropTypes.bool,
  communityUrl: PropTypes.string,
  isAdmin: PropTypes.bool,
  isSignedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func,
  isHmc: PropTypes.bool
};
