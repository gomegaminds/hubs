import React from "react";
import ReactDOM from "react-dom";
import Store from "./storage/store";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { VerifyPage } from "./mega-src/react-components/auth/VerifyPage";

const store = new Store();
window.APP = { store };

function Root() {
    return (
        <AuthContextProvider store={store}>
            <VerifyPage />
        </AuthContextProvider>
    );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
