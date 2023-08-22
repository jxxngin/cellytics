const path = require("path");
const fs = require("fs");
const os = require("os");
const isDev = require("electron-is-dev");
const { execFile } = require("child_process");
const killPort = require("kill-port");

const {
    app,
    BrowserWindow,
    ipcMain,
    globalShortcut,
    protocol,
} = require("electron");

let win;

const BASE = "C:\\CellyticsNK";
// const BASE = "/Users/ktw";
const serverPath = path.join(BASE, "cam", "cellytics_server.exe");
let dataPath = path.join(BASE, "data");
if (isDev) {
    dataPath = path.join(os.homedir(), "cmos-data");
}
const configPath = path.join(dataPath, "config.json");
const historyPath = path.join(dataPath, "history");
const countHistoryPath = path.join(historyPath, "count");
const toxicityHistoryPath = path.join(historyPath, "toxicity");
const resultPath = path.join(historyPath, "result");
const cmosServer = (plag) => {
    if (isDev) {
        return new Promise(resolve => {
            resolve(true);
        });
    }
    if (plag) {
        return new Promise(resolve => {
            try {
                execFile(
                    serverPath,
                    {
                        windowsHide: true,
                    },
                    (err, stdout, stderr) => {
                        if (err) console.log(err);
                        if (stdout) console.log(stdout);
                        if (stderr) console.log(stderr);
                    }
                );
            }
            catch (err) {
                resolve(err);
            }
            setTimeout(() => {
                resolve(true);
            }, 2000);
        });
    }
    else {
        return new Promise((resolve) => {
            killPort(5000)
                .then(() => {
                    resolve(true);
                })
                .catch((err) => {
                    resolve(err);
                })
        });
    }
}

const distPath = path.join(__dirname, "../dist");
const indexPath = `${path.join(distPath, "build/index.html")}`;
const assetsPath = path.join(__dirname, "../assets", "images");

async function createWindow() {
    await cmosServer(true);
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1280,
        minHeight: 800,
        title: "Cellytics NK",
        resizable: true,
        useContentSize: true,
        frame: false,
        webPreferences: {
            nativeWindowOpen: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            preload: path.join(__dirname, './preload.js'),
        },
    });

    if (isDev) {
        // globalShortcut.register('f5', () => {
        //     win.loadFile(indexPath);
        // });
        globalShortcut.register('CommandOrControl+R', () => {
            win.loadFile(indexPath);
        });
    }

    // win.webContents.on('before-input-event', (event, input) => {
    //     if (input.control && input.key.toLowerCase() === 'r') {
    //         event.preventDefault();
    //         win.loadFile(indexPath);
    //     }
    // });

    protocol.registerFileProtocol('image', (req, cb) => {
        let url = req.url.slice('image://'.length);
        const _path = path.normalize(`${assetsPath}/${url}`);
        cb({ path: _path });
    });

    win.setMenuBarVisibility(false);
    win.loadFile(indexPath);
    if (isDev) win.webContents.openDevTools({ mode: "undocked" });
}

// image src https config
app.commandLine.appendSwitch('ignore-certificate-errors');

app.on("ready", createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", async (e) => {
    e.preventDefault();
    await cmosServer(false);
    // console.log("[before-quit] quit electron app");
    app.exit();
})

app.on("activate", () => {
    if (win === null) {
        createWindow();
    }
});

ipcMain.on("window-close", async () => {
    app.quit();
});

ipcMain.on("cmos_server_restart", async () => {
    let res = await cmosServer(false);
    if (res !== true) {
        win.webContents.send("cmos_server_restart", res);
        return;
    }
    res = await cmosServer(true);
    if (res !== true) {
        win.webContents.send("cmos_server_restart", res);
        return;
    }
    win.webContents.send("cmos_server_restart", "SUCCESS");
});

ipcMain.on("refresh", () => {
    win.loadFile(indexPath);
});

const initConfig = [
    {
        id: 1,
        name: "Dunallella tertio",
        grid: 4,
        threshold: 40,
    },
];
ipcMain.on("getConfig", () => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(initConfig, null, 4));
        win.webContents.send("getConfig", initConfig);
        return;
    }
    try {
        const config = fs.readFileSync(configPath, { encoding: 'utf8', flag: 'r' });
        win.webContents.send("getConfig", JSON.parse(config));
    }
    catch {
        win.webContents.send("getConfig", initConfig);
    }
});

ipcMain.on("setConfig", (event, data) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(initConfig, null, 4));
        win.webContents.send("setConfig", true);
        return;
    }
    fs.writeFileSync(configPath, JSON.stringify(data, null, 4));
    win.webContents.send("setConfig", true);
});

ipcMain.on("historyList", (event, key) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(historyPath)) {
        fs.mkdirSync(historyPath);
    }
    let _path;
    if (key === "count") _path = countHistoryPath;
    else if (key === "toxicity") _path = toxicityHistoryPath;
    else if (key === "result") _path = resultPath;
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
    }
    const list = fs.readdirSync(_path);
    win.webContents.send("historyList", list);
});
ipcMain.on("historyList2", (event, key) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(historyPath)) {
        fs.mkdirSync(historyPath);
    }
    let _path;
    if (key === "count") _path = countHistoryPath;
    else if (key === "toxicity") _path = toxicityHistoryPath;
    else if (key === "result") _path = resultPath;
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
    }
    const list = fs.readdirSync(_path);
    win.webContents.send("historyList2", list);
});

ipcMain.on("getHistory", (event, key, filename) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(historyPath)) {
        fs.mkdirSync(historyPath);
    }
    let _path;
    if (key === "count") _path = countHistoryPath;
    else if (key === "toxicity") _path = toxicityHistoryPath;
    else if (key === "result") _path = resultPath;
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
    }
    _path = path.join(_path, filename);
    const history = require(_path);
    win.webContents.send("getHistory", history);
});
ipcMain.on("getHistory2", (event, key, filename) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(historyPath)) {
        fs.mkdirSync(historyPath);
    }
    let _path;
    if (key === "count") _path = countHistoryPath;
    else if (key === "toxicity") _path = toxicityHistoryPath;
    else if (key === "result") _path = resultPath;
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
    }
    _path = path.join(_path, filename);
    const history = require(_path);
    win.webContents.send("getHistory2", history);
});

ipcMain.on("addHistory", (event, key, filename, data) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
    if (!fs.existsSync(historyPath)) {
        fs.mkdirSync(historyPath);
    }
    let _path;
    if (key === "count") _path = countHistoryPath;
    else if (key === "toxicity") _path = toxicityHistoryPath;
    else if (key === "result") _path = resultPath;
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
    }
    _path = path.join(_path, `${filename}.json`);
    fs.writeFileSync(_path, JSON.stringify(data, null, 4));
});
