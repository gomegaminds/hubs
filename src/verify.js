import React from "react";
import ReactDOM from "react-dom";
import Store from "./storage/store";
import { VerifyPage } from "./mega-src/react-components/auth/VerifyPage";

const store = new Store();
window.APP = { store };

function Root() {
    return <VerifyPage />;
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
