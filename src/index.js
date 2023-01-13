import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Store from "./storage/store";
import { HomeRoot } from "./mega-src/react-components/home/HomeRoot";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import FirstTimeFlow from "./mega-src/react-components/home/FirstTimeFlow";

const store = new Store();
window.APP = { store };

function Root() {
    return (
        <Auth0Provider
            domain="megaminds-prod.us.auth0.com"
            clientId="4VYsoMjINRZrBjnjvFLyn5utkQT9YRnM"
            redirectUri={window.location.origin}
            audience="https://api.megaminds.world"
            scope="openid profile email read:classrooms read:teacher_profile create:submission"
            useRefreshTokens
            cacheLocation="localstorage"
        >
            <HashRouter>
                <Routes>
                    <Route exact path="/" element={<HomeRoot />}></Route>
                    <Route exact path="/entry" element={<FirstTimeFlow />}></Route>
                </Routes>
            </HashRouter>
        </Auth0Provider>
    );
}

const root = ReactDOM.createRoot(document.getElementById("home-root"));
root.render(<Root />);
