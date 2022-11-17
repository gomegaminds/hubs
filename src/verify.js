import React from "react";
import ReactDOM from "react-dom";
import Store from "./storage/store";
import { VerifyPage } from "./mega-src/react-components/auth/VerifyPage";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

const store = new Store();
window.APP = { store };

function Root() {
    return (
        <AuthContextProvider store={store}>
            <VerifyPage />
        </AuthContextProvider>
    );
}

const root = ReactDOM.createRoot(document.getElementById("verify-root"));
root.render(<Root />);
