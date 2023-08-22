import $ from "jquery";
import { io } from "socket.io-client";

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

    public call(name, ...data) {
        window.api.send(name, ...data);
    }
    
    public receive(name, callback) {
        if (!callback) return;
        window.api.receive(name, callback);
    }

    public cmosURL(api) {
        const CMOS_URL = "http://127.0.0.1:5000";
        // const CMOS_URL = "http://172.16.0.5:5000";
        return `${CMOS_URL}/${api}`;
    }

    public async cmosAPI(api, body = null) {
        const uri = this.cmosURL(api);
        let res;
        if (body) {
            res = await fetch(uri, {
                method: "post",
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
            });
        }
        else {
            res = await fetch(uri);
        }
        res = await res.text();
        return res;
    }
}