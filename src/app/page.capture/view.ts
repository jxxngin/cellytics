import { OnInit, OnDestroy } from "@angular/core";
import { Service } from "@wiz/libs/portal/season/service";
import Store from "@wiz/libs/store";

const iw = 2592;
const ih = 1944;
const ratio = ih / iw;

export class Component implements OnInit, OnDestroy {
    private username = "";
    private src = null;
    private name = "";
    private mode = "vehicle";
    private cal = false;
    private option = {
        led: 165,
        bgavg: 0,
        threshold: 0,
    };

    constructor(
        public service: Service,
        public store: Store,
    ) {
        this.Math = Math;
    }

    public async ngOnInit() {
        await this.service.init();

        setTimeout(() => {
            this.setSrc();
        }, 300);
        setTimeout(() => {
            this.getLed();
        }, 1500);
        setTimeout(() => {
            this.getTh();
        }, 200);
        this.intervalId = setInterval(() => {
            this.getAvg();
        }, 200);
    }

    public async ngOnDestroy() {
        try {
            clearInterval(this.intervalId);
        } catch { }
        await wiz.cmosAPI("cam/streamend");
        this.src = null;
        await this.service.render();
    }

    private setSrc() {
        const n = ("" + +new Date()).slice(8);
        this.src = wiz.cmosURL(`cam/stream?id=${n}`);
        this.service.render();
    }

    private async getAvg() {
        const img = document.querySelector("#cmos-cam");
        if (!img) return 0;
        let canvas = document.createElement("canvas");
        const { width, height } = img;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) return 0;
        context.drawImage(img, 0, 0);
        try {
            const { data } = context.getImageData(0, 0, width, height);
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum += data[i];
            }
            const result = Math.round(sum / (data.length / 4));
            this.option.bgavg = result;
            await this.service.render();
        } catch {
            console.debug("cam connect not yet.");
            return;
        }
    }

    private async getLed() {
        const res = await wiz.cmosAPI("cam/brightness");
        try {
            this.option.led = +res;
            await this.service.render();
        } catch { }
    }

    private async setLed(value) {
        await wiz.cmosAPI(`cam/set_brightness/${value}`);
        this.option.led = value;
        this.service.render();
    }

    private async change() {
        console.debug("chagne led", this.option.led);
        if (this.option.led < 1 || this.option.led > 255) return;
        await this.service.render();
        await wiz.cmosAPI(`cam/set_brightness/${this.option.led}`);
    }

    private getTh() {
        wiz.receive("getConfig", async (res) => {
            this.option.threshold = res[0].threshold;
            await this.service.render();
        });
        wiz.call("getConfig");
    }

    private setTh(value) {
        this.option.threshold = value;

        const config = [
            {
                id: 1,
                name: "Dunallella tertio",
                grid: 4,
                threshold: value,
            },
        ];
        wiz.call("setConfig", config);
    }

    private setMode() {
        this.mode = this.mode === 'vehicle' ? 'asc' : 'vehicle';
    }

    private async back() {
        const save = this.store.capture.save;

        if (save > 0) {
            let res = await this.service.alert.show({
                title: "Back",
                message: "저장한 이미지가 존재합니다.\n 그래도 취소하시겠습니까?",
                action: "Yes",
                cancel: "No",
            });

            if (!res) {
                return;
            }
        }

        this.store.capture.list = [];
        this.store.capture.show = [];
        this.store.capture.save = 0;
        this.store.capture.vehicle = 0;
        this.store.capture.asc = 0;

        this.service.href('/main');
    }

    private async name() {

    }

    private onCal() {
        this.cal = !this.cal;
    }

    private async check() {
        this.store.setting.led = this.option.led;
        this.store.setting.bgavg = this.option.bgavg;
        this.store.setting.threshold = this.option.threshold;

        this.counting(this.store.capture.save);
    }

    private async save(filepath) {
        const body = {
            filepath,
        };
        await wiz.cmosAPI("cam/save", body);
    }

    private async algolCount(filepath) {
        const { grid, threshold } = this.store.setting;
        const body = {
            filepath,
            grid,
            threshold,
        };
        let res = await wiz.cmosAPI("algol/count", body);
        res = res.slice(1);
        return res.split("/").slice(0, -1);
    }

    // 여기부터
    private async counting(i) {
        await this.service.loading.show();
        const date = new Date();
        const y = date.getFullYear();
        const fill = (v) => {
            return ("" + v).padStart(2, '0');
        }
        const m = fill(date.getMonth() + 1);
        const d = fill(date.getDate());
        const h = fill(date.getHours());
        const mm = fill(date.getMinutes());
        const s = fill(date.getSeconds());
        const filename = `${y}${m}${d}_${h}${mm}${s}.png`;
        // const filename = "IMG_20230317_144828.jpg";
        const filepath = `C:\\CellyticsNK\\data\\count\\${filename}`;
        await this.save(filepath);
        let res = await this.algolCount(filepath);
        // await this.service.loading.hide();
        this.store.capture.list[i] = {
            img: wiz.cmosURL(`cam/count/${filename}`),
            result: res.map(item => {
                const [x, y, size] = item.split(",");
                return {
                    x: x * 1,
                    y: y * 1,
                    size: size * 1,
                };
            }),
            name: this.name.length == 0 ? `IMG_${y}${m}${d}_${h}${mm}${s}` : this.name,
            // name: "IMG_20230317_144828",
            date: `${y}-${m}-${d} ${h}:${mm}:${s}`,
            mode: this.mode,
        };
        this.service.href('/capture/result');
    }

    private async finish() {
        let res = await this.service.alert.show({
            title: "Finish",
            message: "종료하시겠습니까?",
            action: "Yes",
            cancel: "No",
        });

        if (!res)
            return;

        const date = new Date();
        const y = date.getFullYear();
        const fill = (v) => {
            return ("" + v).padStart(2, '0');
        }
        const m = fill(date.getMonth() + 1);
        const d = fill(date.getDate());
        const h = fill(date.getHours());
        const mm = fill(date.getMinutes());
        const s = fill(date.getSeconds());

        const username = this.store.setting.username;
        const result = this.store.capture.save;
        const formated = `${y}${m}${d}_${h}${mm}${s}_${username}_${result}`;

        let vehicle = 0;
        let asc = 0;
        let cell = 0;

        for (let i = 0; i < this.store.capture.save; i++) {
            if (this.store.capture.list[i].mode == 'vehicle') {
                vehicle += this.store.capture.list[i].show;
            }
            else {
                asc += this.store.capture.list[i].show;
            }
            cell += Math.round(this.store.capture.list[i].result.length * 409.9);
        }

        vehicle /= this.store.capture.vehicle;
        asc /= this.store.capture.asc;
        res = asc / vehicle * 100;
        cell /= this.store.capture.save;

        this.store.capture.show = {
            vehicle: vehicle,
            asc: asc,
            result: res,
            cell: cell,
        };

        wiz.call("addHistory", 'result', formated, {
            setting: this.store.setting,
            capture: this.store.capture,
        });

        this.store.capture.list = [];
        this.store.capture.show = [];
        this.store.capture.save = 0;
        this.store.capture.vehicle = 0;
        this.store.capture.asc = 0;
        this.store.result_id = formated + ".json";

        this.service.href('/history/result');
    }

    private async showName() {
        const modal = document.getElementsByClassName("modal-page")[0];
        modal.style.display = "block";

        setTimeout(async () => {
            const inputEl = document.querySelector("#input");
            inputEl.focus();
        }, 300)
        this.username = this.store.setting.username;

        await this.service.render();
    }

    private async editName(name) {
        if (name.length === 0) {
            this.service.toast.error("이름을 입력해주세요.");
            return;
        }
        this.store.setting.username = name;

        const modal = document.getElementsByClassName("modal-page")[0];
        modal.style.display = "none"

        await this.service.render();
    }

    private async notEdit() {
        const modal = document.getElementsByClassName("modal-page")[0];
        modal.style.display = "none"

        await this.service.render();
    }
}
