import { OnInit, OnDestroy } from '@angular/core';
import { Service } from "@wiz/libs/portal/season/service";
import Store from "@wiz/libs/store";
import { Chart } from 'chart.js/auto';
import * as XLSX from 'xlsx';

const rectOffset = 30;

export class Component implements OnInit, OnDestroy {
    private img: any;
    private canvas: any;
    private myChart;

    private min = 0;
    private max = 255;

    private filename = "";
    private tab = "result";
    private imgVis = null;

    private liveResult = null;

    private result = {
        name: "",
        date: "",
        mode: null,
        total: 0,
        tc: 0,
    };
    private param = [
        { name: 'CMV', result: 0 },
        { name: 'PPD', result: 0 },
        { name: 'MMD', result: 0 },
        { name: 'SMD', result: 0 },
        { name: 'WCM_mean', result: 0 },
        { name: 'WCM_STD', result: 0 },
        { name: 'WCM_min', result: 0 }
    ];
    private param2 = [
        { name: 'WSM_mean', result: 0 },
        { name: 'WSM_STD', result: 0 },
        { name: 'WSM_min', result: 0 },
        { name: 'WSM_min * WSM_STD', result: 0 },
        { name: 'SMD * WSM_STD', result: 0 },
        { name: 'CSP', result: 0 },
        // { name: 'count', result: 0 }
    ];

    private save = 0;
    private idx = 0;
    private densityOffset = 409.9;

    constructor(
        public service: Service,
        public store: Store,
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.load();
    }

    public async ngOnDestroy() {
        this.store.capture.list = [];
        this.store.capture.show = [];
        this.store.capture.save = 0;
        this.store.capture.vehicle = 0;
        this.store.capture.asc = 0;
    }

    private async load() {
        this.min = 0;
        this.max = 255;

        this.imgVis = null;
        this.toggleImgVis();

        this.filename = this.store.result_id;
        await this.service.loading.show();
        this.getHistory(this.filename);

        await this.service.render();
    }

    private getHistory(filename) {
        wiz.receive("getHistory", async (res) => {
            console.debug(`load history ${this.tab}`, res);
            await this.setResult(res);
            await this.service.render();
        });
        wiz.call("getHistory", this.tab, filename);
    }

    private async setResult(res) {
        this.store.capture = res.capture;
        let img = this.store.capture.list[this.idx].img;
        if (img.includes("result")) {
            img = img.replace("result", "count");
        }
        await this.service.render();

        this.img = document.querySelector('#result-img');
        this.img.addEventListener("load", (event) => {
            this.img.removeEventListener("load", event.target.onload);
            event.target.onload = null;
        });
        this.img.src = img;

        this.canvas = document.querySelector('#result-canvas');
        const idx = this.idx;
        this.save = this.store.capture.save;
        this.result.name = this.store.capture.list[idx].name;
        this.result.date = this.store.capture.list[idx].date;
        this.result.mode = this.store.capture.list[idx].mode;
        this.result.list = this.store.capture.list[idx].cal;

        setTimeout(async () => {
            this.cal(idx);
        }, 3000);
    }

    private async prev() {
        this.idx--;
        await this.load();
    }

    private async next() {
        this.idx++;
        await this.load();
    }

    // Sheet 하나로 합쳐서 다운로드 될수 있게 기능 추가 필요
    private async download() {
        const title = [];
        this.param.forEach((item) => {
            title.push(item.name);
        });
        this.param2.forEach((item) => {
            title.push(item.name);
        });

        const results = this.result.list;
        const transposed = this.transpose(results);

        const means = results.map((result) => {
            return this.getMean(result);
        });

        const res = means.map((result, index) => {
            return [title[index], result];
        });

        const filename = this.result.name;
        const date = this.result.date;
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([...res, [], [filename], [date], title, ...transposed]);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }

    private transpose(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const transposed = Array.from({ length: cols }, () => Array(rows));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                transposed[j][i] = matrix[i][j];
            }
        }

        return transposed;
    }

    private async toggleImgVis() {
        const imgEl = document.querySelector('#result-img');
        const boxEl = document.querySelector('#count-box');
        const graphEl = document.getElementById('result-chart');

        if (this.imgVis == "IMG") {
            imgEl.style.display = "block";
            boxEl.style.display = "block";
            graphEl.style.display = "none";
            this.imgVis = "GRAPH";
        }

        else {
            imgEl.style.display = "none";
            boxEl.style.display = "none";
            graphEl.style.display = "block";
            this.imgVis = "IMG";
        }

        await this.service.render();
    }

    private clearCanvas() {
        const canvas = document.querySelector("#count-box");
        const { img } = this;
        const { width, height } = img;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
    };

    private drawBox(result) {
        this.clearCanvas();
        const canvas = document.querySelector("#count-box");
        const { img } = this;
        const { width, height } = img;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "red";
        const zoom = width / 2592;
        result.forEach((cell) => {
            const { x, y } = cell;
            const sx = x * zoom - rectOffset / 2;
            const sy = y * zoom - rectOffset / 2;
            ctx.strokeRect(sx, sy, rectOffset, rectOffset);
        });
    }

    private async cal(idx) {
        const result = this.store.capture.list[idx].result;
        const canvas = document.createElement("canvas");
        canvas.width = 2592;
        canvas.height = 1944;
        const ctx = canvas.getContext('2d');
        const { img } = this;
        ctx.drawImage(img, 0, 0);

        const liveResult = result.filter(pos => this.cmvFilter(ctx, pos));
        this.liveResult = liveResult;
        const deadResult = result.filter(pos => !this.cmvFilter(ctx, pos));
        setTimeout(() => {
            this.drawBox(liveResult);
            this.drawChart();
        }, 1000);
        await this.service.loading.hide();

        this.result.total = result.length;
        this.result.tc = Math.round(result.length * this.densityOffset);
        this.param.find(item => item.name === 'CMV').result = this.limitRes(this.getMean(this.result.list[0]));
        this.param.find(item => item.name === 'PPD').result = this.limitRes(this.getMean(this.result.list[1]));
        this.param.find(item => item.name === 'MMD').result = this.limitRes(this.getMean(this.result.list[2]));
        this.param.find(item => item.name === 'SMD').result = this.limitRes(this.getMean(this.result.list[3]));
        this.param.find(item => item.name === 'WCM_mean').result = this.limitRes(this.getMean(this.result.list[4]));
        this.param.find(item => item.name === 'WCM_STD').result = this.limitRes(this.getMean(this.result.list[5]));
        this.param.find(item => item.name === 'WCM_min').result = this.limitRes(this.getMean(this.result.list[6]));

        this.param2.find(item => item.name === 'WSM_mean').result = this.limitRes(this.getMean(this.result.list[7]));
        this.param2.find(item => item.name === 'WSM_STD').result = this.limitRes(this.getMean(this.result.list[8]));
        this.param2.find(item => item.name === 'WSM_min').result = this.limitRes(this.getMean(this.result.list[9]));
        this.param2.find(item => item.name === 'WSM_min * WSM_STD').result = this.limitRes(this.getMean(this.result.list[10]));
        this.param2.find(item => item.name === 'SMD * WSM_STD').result = this.limitRes(this.getMean(this.result.list[11]));
        this.param2.find(item => item.name === 'CSP').result = this.limitRes(this.getCSP(this.result.list[12]));

        await this.service.render();
    }

    private cmvFilter(ctx, { x, y }) {
        const res = ctx.getImageData(x - rectOffset / 2, y, rectOffset + 1, 1);
        const codeArr = res.data.reduce((acc, val, idx) => {
            if (idx % 4 !== 0) return acc;
            acc.push(val);
            return acc;
        }, []);
        const point = Math.round(codeArr.length / 2);
        const tmp = [codeArr[point + 1], codeArr[point], codeArr[point - 1]];

        const max = Math.max(...tmp);
        if (this.min > max || this.max < max) return false;
        return true;
    }

    private cmvlimit() {
        if (this.min < 0) this.min = 0;
        if (this.min > 255) this.min = 255;
        if (this.max < 0) this.max = 0;
        if (this.max > 255) this.max = 255;
    }

    private getMean(arr) {
        const filteredArr = arr.filter((val) => typeof val !== "undefined");
        const len = filteredArr.length;
        if (len <= 1) return 0;

        const sum = (acc, val) => (acc += val);
        const avg = filteredArr.reduce(sum) / len;

        return avg;
    }

    private getMul(arr1, arr2) {
        return arr1.map((val, idx) => val * arr2[idx]);
    }

    private getCSP(arr) {
        let result = [...arr];
        result.sort(function (a, b) {
            return b - a;
        });
        let index = Math.floor(result.length * 0.1);
        return result[index];
    }

    private limitRes(num) {
        return Math.floor(num * 1000) / 1000;
    }

    private drawChart() {
        if (this.myChart) {
            this.myChart.clear();
            this.myChart.destroy();
        }

        const result = this.liveResult;
        const obj = {};
        result.forEach(({ size }) => {
            const key = "" + size;
            if (obj[key] === undefined) obj[key] = 0;
            obj[key]++;
        });
        const labels = Object.keys(obj).sort((a, b) => a - b);

        const data = {
            labels,
            datasets: [
                {
                    label: "Cells",
                    data: labels.map(l => obj[l]),
                    backgroundColor: "rgba(184, 29, 36, 0.1)",
                    borderColor: "#B81D24",
                    borderWidth: 1,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.4,
                },
            ],
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Cell Size",
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Cells",
                        }
                    }
                },
                interaction: {
                    intersect: false,
                }
            },
        };

        const ctx = document.getElementById('result-chart').getContext('2d');
        this.myChart = new Chart(ctx, config);
    }
}
