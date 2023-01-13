import readline from "readline";
import { connectToReticulum } from "../src/utils/phoenix-utils";
import Store from "../src/storage/store";
import AuthChannel from "../src/utils/auth-channel";
import configs from "../src/utils/configs.js";
import { Socket } from "phoenix-channels";
import { writeFileSync } from "fs";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = q => new Promise(res => rl.question(q, res));

(async () => {
    configs.RETICULUM_SERVER = "flamboyant-artificer.megaminds.world";
    configs.RETICULUM_SOCKET_PROTOCOL = "wss:";

    const socket = await connectToReticulum(false, null, Socket);
    const store = new Store();

    const email = await ask("Your admin account email (eg admin@yoursite.com): ");
    console.log(`Logging into ${host} as ${email}. Click on the link in your email to continue.`);
    const authChannel = new AuthChannel(store);
    authChannel.setSocket(socket);
    const { authComplete } = await authChannel.startAuthentication(email);
    await authComplete;
    const { token } = store.state.credentials;
    const creds = {
        host: "megaminds.world",
        email,
        token
    };

    writeFileSync(".ret.credentials", JSON.stringify(creds));
    rl.close();
    console.log(
        "Login successful.\nCredentials written to .ret.credentials. Run npm run logout to remove credentials."
    );
    process.exit(0);
})();
