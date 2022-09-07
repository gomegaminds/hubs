import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import "./react-components/styles/global.scss";
import { ThemeProvider } from "./react-components/styles/theme";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

function Root() {

    return (
        <WrappedIntlProvider>
            <Auth0Provider
                domain="megaminds-prod.us.auth0.com"
                clientId="4VYsoMjINRZrBjnjvFLyn5utkQT9YRnM"
                redirectUri={window.location.origin}
                audience="https://api.megaminds.world"
                scope="openid profile email read:classrooms read:teacher_profile create:submission"
                useRefreshTokens
                cacheLocation="localstorage"
            >
                <ThemeProvider store={store}>
                    <AuthContextProvider store={store}>
                        <HomePage />
                    </AuthContextProvider>
                </ThemeProvider>
            </Auth0Provider>
        </WrappedIntlProvider>
    );
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
