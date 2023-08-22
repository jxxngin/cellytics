// pubilc/preload.js
const { ipcRenderer, contextBridge } = require("electron");

process.once("loaded", () => {
    window.ipcRenderer = ipcRenderer;
    if (
        process &&
        process.env &&
        process.env.npm_lifecycle_script &&
        process.env.npm_lifecycle_script === "electron ."
    ) {
        window.isDev = true;
    } else {
        window.isDev = false;
    }
});

const isDev =
    process &&
    process.env &&
    process.env.npm_lifecycle_script &&
    process.env.npm_lifecycle_script === "electron .";

contextBridge.exposeInMainWorld("env", {
    isDev,
});

contextBridge.exposeInMainWorld("api", {
    send: (channel, ...data) => {
        //whitelist channels
        const validChannels = [
            "window-close",
            "refresh",
            "cmos_server_restart",
            "getConfig",
            "setConfig",
            "historyList",
            "historyList2",
            "getHistory",
            "getHistory2",
            "addHistory",
        ];
        if (!validChannels.includes(channel)) {
            return;
        }
        ipcRenderer.send(channel, ...data);
    },
    receive: (channel, func) => {
        const validChannels = [
            "cmos_server_restart",
            "getConfig",
            "setConfig",
            "historyList",
            "historyList2",
            "getHistory",
            "getHistory2",
            "addHistory",
        ];
        if (!validChannels.includes(channel)) {
            return;
        }
        const f = (event, ...args) => {
            func(...args);
            ipcRenderer.removeListener(channel, f);
        }
        ipcRenderer.on(channel, f);
    },
});
