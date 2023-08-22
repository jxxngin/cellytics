import { OnInit } from '@angular/core';
import { Service } from "@wiz/libs/portal/season/service";
import Store from "@wiz/libs/store";

export class Component implements OnInit {
    private tab = "result";
    private list = [];
    private idx = 0;

    constructor(
        public service: Service,
        public store: Store,
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.load();
        await this.service.render();
    }

    private async load() {
        this.getHistoryList();
    }

    private async result(id) {
        this.store.result_id = id;
        this.service.href(`/history/result`);
    }

    private getHistoryList() {
        wiz.receive("historyList", async (res) => {
            console.debug(`load history in history page, ${this.tab}`, res);
            this.filename = res;
            for (let i = 0; i < res.length; i++) {
                await this.getHistory(this.filename[i]);
            }
            await this.service.render();

        });
        wiz.call("historyList", this.tab);
    }

    private async getHistory(filename) {
        return new Promise(async (resolve, reject) => {
            wiz.receive("getHistory", async (res) => {
                try {
                    console.debug(`load history ${this.tab}`, res);
                    await this.getResult(res.capture.show, filename);
                    await this.service.render();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            wiz.call("getHistory", this.tab, filename);
        });
    }

    private async getResult(res, filename) {
        let tmp = filename.split('_');

        let id = filename;
        let date = tmp[0].slice(0, 4) + '-' + tmp[0].slice(4, 6) + '-' + tmp[0].slice(6);
        let name = tmp[2];
        let show = res;

        this.list[this.idx] = {
            username: name,
            id: id,
            date: date,
            show: show,
        };

        this.idx++;
        await this.service.render();
    }
}