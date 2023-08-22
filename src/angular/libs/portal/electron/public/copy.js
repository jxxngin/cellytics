const path = require("path");
const fs = require("fs");

// branch/main
const rootPath = path.join(process.env.PWD, "..");
const buildPath = path.join(rootPath, "build");

const copy = (src = [], target) => {
    try {
        fs.rmSync(path.join(buildPath, target), { recursive: true });
    } catch {}
    fs.cpSync(
        path.join(rootPath, ...src, target),
        path.join(buildPath, target),
        { recursive: true },
    );
}

copy(["portal", "electron", "libs"], "public");
copy(["src"], "assets");
