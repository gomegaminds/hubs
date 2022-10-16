import React, { useContext, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import classNames from "classnames";
import configs from "../../utils/configs";
import { CreateRoomButton } from "./CreateRoomButton";
import { PWAButton } from "./PWAButton";
import { useFavoriteRooms } from "./useFavoriteRooms";
import { usePublicRooms } from "./usePublicRooms";
import styles from "./HomePage.scss";
import { AuthContext } from "../auth/AuthContext";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { MediaGrid } from "../room/MediaGrid";
import { MediaTile } from "../room/MediaTiles";
import { PageContainer } from "../layout/PageContainer";
import { scaledThumbnailUrlFor } from "../../utils/media-url-utils";
import { Column } from "../layout/Column";
import { Container } from "../layout/Container";
import { SocialBar } from "../home/SocialBar";
import { SignInButton } from "./SignInButton";
import { AppLogo } from "../misc/AppLogo";
import { isHmc } from "../../utils/isHmc";
import maskEmail from "../../utils/mask-email";

import Button from "react-bootstrap/Button";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

export function HomePage() {
    const { handleRedirectCallback } = useAuth0();

    handleRedirectCallback().then((data) => {
        if (data.appState.target) {
            window.location.replace(data.appState.target);
        }
    });

    const auth = useContext(AuthContext);
    const intl = useIntl();

    useEffect(() => {
        const qs = new URLSearchParams(location.search);

        // Support legacy sign in urls.
        if (qs.has("sign_in")) {
            const redirectUrl = new URL("/signin", window.location);
            redirectUrl.search = location.search;
            window.location = redirectUrl;
        } else if (qs.has("auth_topic")) {
            const redirectUrl = new URL("/verify", window.location);
            redirectUrl.search = location.search;
            window.location = redirectUrl;
        }

        if (qs.has("new")) {
            createAndRedirectToNewHub(null, null, true);
        }
    }, []);

    const canCreateRooms = !configs.feature("disable_room_creation") || auth.isAdmin;
    const email = auth.email;

    return (
        <div className="d-flex justify-content-center text-center">
            <div style={{ height: "80px", width: "180px" }}>
                <AppLogo className={styles.appLogo} />
                <br />
                <p>Take online learning to a whole new world</p>
                <Button href="https://dash.megaminds.world" variant="purple-dark">Go to Dashboard</Button>
            </div>
        </div>
    );
}
