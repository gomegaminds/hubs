import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Routes, Route } from "react-router-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import Store from "./storage/store";
import { HomeRoot } from "./mega-src/react-components/home/HomeRoot";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import FirstTimeFlow from "./mega-src/react-components/entry/FirstTimeFlow";

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
                <AuthContextProvider store={store}>
                    <HashRouter>
                        <Route exact path="/">
                            <HomeRoot />
                        </Route>
                        <Route exact path="/entry">
                            <FirstTimeFlow />
                        </Route>
                    </HashRouter>
                </AuthContextProvider>
            </Auth0Provider>
        </WrappedIntlProvider>
    );
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
