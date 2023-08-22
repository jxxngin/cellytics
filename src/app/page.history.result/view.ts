import { OnInit, Input } from '@angular/core';
import { Service } from "@wiz/libs/portal/season/service";
import Store from "@wiz/libs/store";

export class Component implements OnInit {
    private filename = "";
    private tab = "result";

    private result = [
        { name: "Vehicle", value: 0 },
        { name: "ASC", value: 0 },
        { name: "I", value: 0 },
        { name: "Cell count", value: 0.0 },
    ];
    private count = [
        { title: "age", per: 24 },
        { title: "sex", per: 28 },
    ];
    private activity = [
        { title: "age", per: 9 },
        { title: "sex", per: 11 },
    ];

    constructor(
        public service: Service,
        public store: Store,
    ) { }

    public async ngOnInit() {
        await this.load();
    }

    private async load() {
        await this.service.init();

        this.filename = this.store.result_id;
        await this.getHistory(this.filename);
    }

    private async getHistory(filename) {
        return new Promise(async (resolve, reject) => {
            wiz.receive("getHistory", async (res) => {
                try {
                    console.debug(`load history ${this.tab}`, res);

                    this.result.find(item => item.name === "Vehicle").value = res.capture.show.vehicle;
                    this.result.find(item => item.name === "ASC").value = res.capture.show.asc;
                    this.result.find(item => item.name === "I").value = res.capture.show.result;
                    this.result.find(item => item.name === "Cell count").value = res.capture.show.cell;

                    await this.setting();
                } catch (error) {
                    reject(error);
                }
            });
            wiz.call("getHistory", this.tab, filename);
        });
    }

    private async setting() {
        for (let item of this.result) {
            if (item.name === "I") {
                item.name = this.formatExp("I", 3);
            }
            if (item.name === "Cell count") {
                item.value = Math.floor(item.value * 1) / 1;
                item.value = item.value + " cells/mL";
            }
            else {
                item.value = Math.floor(item.value * 10000) / 10000;
            }
        }
        await this.service.render();
    }

    private formatExp(value, exponent) {
        return `${value}^${exponent}`;
    }
}