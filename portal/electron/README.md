# Wiz electron

## Todo

- electron portal framework
    - edit public/copy.js
    - edit public/electron.js
    - edit public/preload.js
    - ...
- electron ide plugin
    - electron script run(el:start, el:build --win, el:build --mac, ...)
    - build option custom easily (package.json > build)
    - electron dev server start, stop, restart
    - electron dev server console log print

## Installation

### Init `package.json`

1. npm install -g concurrently
2. npm install -D electron electron-builder
3. edit `name`, `version`, `main`, `scripts`, `build` in package.json
    - use cmd+shift+f
    - But now, exist some bug. Please edit branch/main/build/package.json edit directly.
```json
{
    "name": "season_launcher",
    "version": "0.0.1",
    "main": "public/electron.js",
    "scripts": {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development",
        "test": "ng test",
        "el:copy": "node src/libs/portal/electron/public/copy.js",
        "el:dev": "electron .",
        "el:start": "concurrently --kill-others-on-fail \"npm run el:copy\" \"npm run el:dev\"",
        "el:build": "electron-builder"
    },
    "build": {
        "appId": "com.season.season-launcher",
        "productName": "Season Launcher",
        "mac": {
            "target": [
                "default"
            ],
            "icon": "assets/images/icon/512x512.png"
        },
        "dmg": {
            "title": "Season Launcher",
            "icon": "assets/images/icon/512x512.png"
        },
        "win": {
            "target": "nsis",
            "icon": "assets/images/icon/256x256.png"
        },
        "nsis": {
            "oneClick": false,
            "allowToChangeInstallationDirectory": true,
            "perMachine": true,
            "language": 1042,
            "include": "src/libs/portal/electron/installer.nsh",
            "shortcutName": "Season Launcher",
            "uninstallDisplayName": "Season Launcher"
        },
        "directories": {
            "buildResources": "assets",
            "output": "releases/${platform}/${arch}"
        },
        "files": [
            "dist/build/*",
            "package.json",
            "public/**/*",
            "assets/**/*",
            "assets/**/*.exe",
            "assets/**/*.msi",
            "src/libs/portal/electron/*"
        ]
    }
}
```

### left bottom - Angular/Web Config

| index

- Modify `title`

- Modify `base`
```
base(href="./")
```


### left bottom - Angular/Advanced

| component

```ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        public service: Service,
        public ref: ChangeDetectorRef,
        public router: Router,
    ) { }

    public async ngOnInit() {
        await this.service.init(this);
    }
}
```

| wiz

```ts
import $ from "jquery";

export default class Wiz {
    public namespace: any;
    public baseuri: any;

    constructor(baseuri: any) {
        this.baseuri = baseuri;
    }

    public app(namespace: any) {
        let instance = new Wiz(this.baseuri);
        instance.namespace = namespace;
        return instance;
    }

    public dev() {
        let findcookie = (name) => {
            let ca: Array<string> = document.cookie.split(';');
            let caLen: number = ca.length;
            let cookieName = `${name}=`;
            let c: string;

            for (let i: number = 0; i < caLen; i += 1) {
                c = ca[i].replace(/^\s+/g, '');
                if (c.indexOf(cookieName) == 0) {
                    return c.substring(cookieName.length, c.length);
                }
            }
            return '';
        }

        let isdev = findcookie("season-wiz-devmode");
        if (isdev == 'true') return true;
        return false;
    }

    public branch() {
        let findcookie = (name) => {
            let ca: Array<string> = document.cookie.split(';');
            let caLen: number = ca.length;
            let cookieName = `${name}=`;
            let c: string;

            for (let i: number = 0; i < caLen; i += 1) {
                c = ca[i].replace(/^\s+/g, '');
                if (c.indexOf(cookieName) == 0) {
                    return c.substring(cookieName.length, c.length);
                }
            }
            return '';
        }

        let branch = findcookie("season-wiz-branch");
        if (branch) return branch;
        return "main";
    }

    public url(path = "") {
        return `https://portal.season.co.kr/${path}`;
    }

    public send(name, ...data) {
        window.api.send(name, ...data);
    }
    
    public receive(name, callback) {
        if (!callback) return;
        window.api.receive(name, callback);
    }

    public call(function_name: string, data = {}) {
        let ajax = {
            url: this.url(function_name),
            type: "POST",
            data,
        };

        return new Promise((resolve) => {
            $.ajax(ajax).always(function (res) {
                resolve(res);
            });
        });
    }
}
```

### window draggable

> styles/styles.scss

```css
/* frameless draggable */
.window-draggable {
    -webkit-app-region: drag;
    -webkit-user-drag: none;
}
```

### Config custom

1. Electron Portal framework -> libs/public/electron.js
    - electron config
2. Electron Portal framework -> libs/public/preload.js
    - native api gateway

### Disable API, Socket

1. IDE Plugin -> Workspace -> app -> Workspace Browser -> Service
    - comment out: editor.create( ... API & Socket ... )

## Script

```shell
branch/main/build# npm run el:start
branch/main/build# npm run el:build --win
branch/main/build# npm run el:build --mac
```

## .gitignore

| branch/main/.gitignore
```
cache/
config/
.vscode/
test/
.DS_Store
portal/

# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# PEP 582; used by e.g. github.com/David-OConnor/pyflow
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

```
