import { paths } from "./userinput/paths";

// Every frame, looks for input paths that trigger UI-relevant events and handles them.
AFRAME.registerSystem("ui-hotkeys", {
    init() {
        this.mediaSearchStore = window.APP.mediaSearchStore;
    },

    tick: function () {
        if (!this.userinput) {
            this.userinput = this.el.systems.userinput;
        }

        if (this.userinput.get(paths.actions.focusChat)) {
            window.dispatchEvent(new CustomEvent("focus_chat", { detail: { prefix: "" } }));
        }

        document.addEventListener("keydown", function (event) {
            if (event.ctrlKey && event.key === "z") {
                alert("Undo!");
                window.APP.commandHelper.undo();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.shiftKey && event.ctrlKey && event.key === "z") {
                alert("redo!");
                window.APP.commandHelper.redo();
            }
        });

        if (this.userinput.get(paths.actions.focusChatCommand)) {
            window.dispatchEvent(new CustomEvent("focus_chat", { detail: { prefix: "/" } }));
        }
    }
});
