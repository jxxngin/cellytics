import { OnInit, OnDestroy } from '@angular/core';
import { Service } from "@wiz/libs/portal/season/service";
import Store from "@wiz/libs/store";
import { Chart } from 'chart.js/auto';
import * as XLSX from 'xlsx';

const rectOffset = 50;

export class Component implements OnInit, OnDestroy {
    private img: any;
    private canvas: any;
    private myChart;

    private min = 0;
    private max = 255;

    private liveResult = null;
    private cmvArr = [];
    private ppdArr = [];
    private mmdArr = [];
    private smdArr = [];
    private wcmArr = [];
    private wcmSTD = [];
    private wcmMin = [];
    private wsmArr = [];
    private wsmSTD = [];
    private wsmMin = [];
    private minSTD = [];
    private smdSTD = [];
    private cspArr = [];

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

    private imgVis = null;
    private densityOffset = 409.9;

    constructor(
        public service: Service,
        public store: Store,
    ) {
        Number.prototype.between = function (s, e, eq = true) {
            if (eq) {
                if (s > this) return false;
                if (e < this) return false;
                return true;
            }
            else {
                if (s >= this) return false;
                if (e <= this) return false;
                return true;
            }
        }
    }

    public async ngOnInit() {
        await this.service.init();
        await this.load();
    }

    public async ngOnDestroy() {
        // this.store.count.result = null;
        // this.store.count.img = null;
    }

    private async load() {
        // await this.service.loading.show();

        const idx = this.store.capture.save;

        let img = this.store.capture.list[idx].img;
        if (img.includes("result")) {
            img = img.replace("result", "count");
        }

        this.img = document.querySelector('#result-img');
        this.img.addEventListener("load", (event) => {
            this.img.removeEventListener("load", event.target.onload);
            event.target.onload = null;
        });
        this.img.src = img;

        this.canvas = document.querySelector('#result-canvas');

        this.min = 0;
        this.max = 255;

        this.result.name = this.store.capture.list[idx].name;
        this.result.date = this.store.capture.list[idx].date;
        this.result.mode = this.store.capture.list[idx].mode;

        this.imgVis = null;
        this.toggleImgVis();

        setTimeout(async () => {
            await this.service.loading.hide();
            this.cal(idx);
        }, 3000);

        await this.service.render();
    }

    private async toggleImgVis() {
        const imgEl = document.getElementById('result-img');
        const boxEl = document.getElementById('count-box');
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
            const sx = x * zoom - 30 / 2;
            const sy = y * zoom - 30 / 2;
            ctx.strokeRect(sx, sy, 30, 30);
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
        // const deadResult = result.filter(pos => !this.cmvFilter(ctx, pos));
        setTimeout(() => {
            this.drawBox(liveResult);
            this.drawChart();
        }, 1000);

        this.cmvArr = result.map(pos => this.getCMV(ctx, pos));
        this.ppdArr = result.map(pos => this.calcPPD(ctx, pos));
        this.mmdArr = result.map(pos => this.calcMMD(ctx, pos));
        this.smdArr = result.map(pos => this.getSTD(ctx, pos, this.calcMMD(ctx, pos)));
        this.wcmArr = result.map(pos => this.calcWCM(ctx, pos));
        this.wcmSTD = result.map(pos => this.getSTD(ctx, pos, this.calcWCM(ctx, pos)));
        this.wcmMin = this.getMin(this.wcmArr);
        this.wsmArr = result.map(pos => this.calcWSM(ctx, pos));
        this.wsmSTD = result.map(pos => this.getSTD(ctx, pos, this.calcWSM(ctx, pos)));
        this.wsmMin = this.getMin(this.wsmArr);
        this.minSTD = this.getMul(this.wsmMin, this.wsmSTD);
        this.smdSTD = this.getMul(this.smdArr, this.wsmSTD);
        this.cspArr = this.getMul(this.ppdArr, this.wsmSTD);

        this.result.total = result.length;
        this.result.tc = Math.round(result.length * this.densityOffset);
        this.param.find(item => item.name === 'CMV').result = this.limitRes(this.getMean(this.cmvArr));
        this.param.find(item => item.name === 'PPD').result = this.limitRes(this.getMean(this.ppdArr));
        this.param.find(item => item.name === 'MMD').result = this.limitRes(this.getMean(this.mmdArr.map(this.getRowMean)));
        this.param.find(item => item.name === 'SMD').result = this.limitRes(this.getMean(this.smdArr));
        this.param.find(item => item.name === 'WCM_mean').result = this.limitRes(this.getMean(this.wcmArr.map(this.getRowMean)));
        this.param.find(item => item.name === 'WCM_STD').result = this.limitRes(this.getMean(this.wcmSTD));
        this.param.find(item => item.name === 'WCM_min').result = this.limitRes(this.getMean(this.wcmMin));

        this.param2.find(item => item.name === 'WSM_mean').result = this.limitRes(this.getMean(this.wsmArr.map(this.getRowMean)));
        this.param2.find(item => item.name === 'WSM_STD').result = this.limitRes(this.getMean(this.wsmSTD));
        this.param2.find(item => item.name === 'WSM_min').result = this.limitRes(this.getMean(this.wsmMin));
        this.param2.find(item => item.name === 'WSM_min * WSM_STD').result = this.limitRes(this.getMean(this.minSTD));
        this.param2.find(item => item.name === 'SMD * WSM_STD').result = this.limitRes(this.getMean(this.smdSTD));
        this.param2.find(item => item.name === 'CSP').result = this.limitRes(this.getCSP(this.cspArr));

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

    private getCMV(ctx, { x, y }) {
        const res = ctx.getImageData(x - rectOffset / 2, y, rectOffset + 1, 1);
        const codeArr = res.data.reduce((acc, val, idx) => {
            if (idx % 4 !== 0) return acc;
            acc.push(val);
            return acc;
        }, []);
        const point = Math.round(codeArr.length / 2);
        const tmp = [codeArr[point + 1], codeArr[point], codeArr[point - 1]];

        const max = Math.max(...tmp);
        return max;
    }

    private cmvlimit() {
        if (this.min < 0) this.min = 0;
        if (this.min > 255) this.min = 255;
        if (this.max < 0) this.max = 0;
        if (this.max > 255) this.max = 255;
    }

    private getDelta(deg) {
        const rad = (deg * Math.PI) / 180;
        const tan = Math.tan(rad);
        let x = 1;
        let y = x * tan;
        // 0 ~ 90 -x y
        // 90 ~ 180 x -y    tan이 minus
        // 180 ~ 270 x -y
        // 270 ~ 360 -x y   tan이 minus
        if (deg.between(0, 90, false)) x *= -1;
        if (deg.between(90, 180, false)) y *= -1;
        if (deg.between(180, 270, false)) y *= -1;
        if (deg.between(270, 360, false)) x *= -1;
        let dx, dy;
        if (deg === 0) {
            dx = -1;
            dy = 0;
        } else if (deg === 90) {
            dx = 0;
            dy = 1;
        } else if (deg === 180) {
            dx = 1;
            dy = 0;
        } else if (deg === 270) {
            dx = 0;
            dy = -1;
        } else {
            dx = x;
            dy = y;
        }
        dx = Math.floor(dx);
        dy = Math.floor(dy);
        return { dx, dy };
    }

    private getPixelByDelta(ctx, x, y, dx, dy) {
        let result = [];
        for (let i = 0; i < rectOffset / 2; i++) {
            const tx = x + i * dx;
            const ty = y + i * dy;
            const data = ctx.getImageData(tx, ty, 1, 1).data;
            const grayValue = data[0];
            result.push(grayValue);
        }
        return result;
    }

    private getLinePixels(ctx, x, y, deg) {
        const right = {
            delta: { ...this.getDelta(deg) },
        };
        right.pixels = this.getPixelByDelta(ctx, x, y, right.delta.dx, right.delta.dy);
        const left = {
            delta: { ...this.getDelta(180 + deg) },
        };
        left.pixels = this.getPixelByDelta(ctx, x, y, left.delta.dx, left.delta.dy);
        return [
            ...left.pixels.reverse(),
            ...right.pixels,
        ];
    }

    // private calcPPD(ctx, { x, y }) {
    //     let arr = [];
    //     for (let i = 0; i < 12; i++) arr.push(15 * i);

    //     return arr.reduce((acc, deg) => {
    //         const pixels = this.getLinePixels(ctx, x, y, deg);
    //         if (pixels.includes(0)) {
    //             return acc;
    //         }

    //         const center = Math.round(pixels.length / 2);
    //         let start = center - Math.round(center * 0.27);
    //         let end = center + Math.round(center * 0.27);

    //         let max = 0;
    //         let min = 255;

    //         for (let i = start; i < end; i++) {
    //             if (pixels[i] > max) {
    //                 max = pixels[i];
    //             }
    //             if (pixels[i] < min) {
    //                 min = pixels[i];
    //             }
    //         }

    //         acc.push(max - min);
    //         return acc;
    //     }, []);
    // }

    private calcPPD(ctx, { x, y }) {
        let arr = [];
        for (let i = 0; i < 1; i++) arr.push(15 * i);

        const result = arr.reduce((acc, deg) => {
            const pixels = this.getLinePixels(ctx, x, y, deg);
            if (pixels.includes(0)) {
                return acc;
            }

            const center = Math.round(pixels.length / 2);
            let start = center - Math.round(center * 0.4);
            let end = center + Math.round(center * 0.4);

            let max = 0;
            let min = 255;

            for (let i = start; i < end; i++) {
                if (pixels[i] > max) {
                    max = pixels[i];
                }
                if (pixels[i] < min) {
                    min = pixels[i];
                }
            }

            acc.push(max - min);
            return acc;
        }, []);
    
        return result[0];
    }

    private calcMMD(ctx, { x, y }) {
        let arr = [];
        for (let i = 0; i < 24; i++) arr.push(15 * i);

        return arr.reduce((acc, deg) => {
            const { dx, dy } = this.getDelta(deg);
            const pixels = this.getPixelByDelta(ctx, x, y, dx, dy);
            if (pixels.includes(0)) {
                return acc;
            }

            const max = Math.max(...pixels);
            const min = Math.min(...pixels);

            acc.push(max - min);
            return acc;
        }, []);
    }

    private calcWCM(ctx, { x, y }) {
        let arr = [];
        for (let i = 0; i < 12; i++) arr.push(15 * i);

        return arr.reduce((acc, deg) => {
            const pixels = this.getLinePixels(ctx, x, y, deg);
            if (pixels.includes(0)) {
                return acc;
            }
            
            const center = Math.round(pixels.length / 2);
            let min = 255;
            let left = 0;

            for (let i = 0; i < center; i++) {
                if (pixels[i] < min) {
                    min = pixels[i];
                    left = i;
                }
            }

            min = 255;
            let right = center;

            for (let i = center; i < pixels.length; i++) {
                if (pixels[i] < min) {
                    min = pixels[i];
                    right = i;
                }
            }

            acc.push(right - left);
            return acc;
        }, []);
    }

    private calcWSM(ctx, { x, y }) {
        let arr = [];
        for (let i = 0; i < 12; i++) arr.push(15 * i);

        return arr.reduce((acc, deg) => {
            const pixels = this.getLinePixels(ctx, x, y, deg);
            if (pixels.includes(0)) {
                return acc;
            }

            const center = Math.round(pixels.length / 2);
            let start = center - Math.round(center * 0.6);
            let end = center - Math.round(center * 0.2);
            
            let max = 0;
            let left = 0;
            for (let i = start; i < end; i++) {
                if (pixels[i] > max) {
                    left = i;
                    max = pixels[i];
                }
            }

            start = center + Math.round(center * 0.2);
            end = center + Math.round(center * 0.6);

            max = 0;
            let right = 0;
            for(let i = start; i < end; i++) {
                if (pixels[i] > max) {
                    right = i;
                    max = pixels[i];
                }
            }

            acc.push(right - left);
            return acc;
        }, []);
    }

    private getRowMean(row) {
        let sum = row.reduce((a, b) => a + b, 0);
        return sum / row.length;
    }

    private getMean(arr) {
        const filteredArr = arr.filter((val) => typeof val !== "undefined");
        const len = filteredArr.length;
        if (len <= 1) return 0;

        const sum = (acc, val) => (acc += val);
        const avg = filteredArr.reduce(sum) / len;

        return avg;
    }

    private getStddev(arr) {
        const len = arr.length;
        if (len <= 1) return 0;

        const sum = (acc, val) => (acc += val);
        const avg = arr.reduce(sum) / len;

        const deviations = arr.map((x) => x - avg);
        const tmp = deviations.map((x) => x * x).reduce(sum);

        return Math.sqrt(tmp / (len - 1));
    }

    private getSTD(ctx, { x, y }, func) {
        return this.getStddev(func);
    }

    private getMin(arr) {
        const result = [];

        for (const row of arr) {
            const min = Math.min(...row);
            result.push(min);
        }

        return result;
    }

    private getMul(arr1, arr2) {
        return arr1.map((val, idx) => val * arr2[idx]);
    }

    private getCSP(arr) {
        let result = [...arr];
        result.sort(function(a, b) {
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

    private async save() {
        let res = await this.service.alert.show({
            title: "Save",
            message: "이 데이터를 저장하시겠습니까?",
            action: "Yes",
            cancel: "No",
        });

        if (!res)
            return;

        const cal = [
            this.cmvArr,
            this.ppdArr,
            this.mmdArr.map(this.getRowMean),
            this.smdArr,
            this.wcmArr.map(this.getRowMean),
            this.wcmSTD,
            this.wcmMin,
            this.wsmArr.map(this.getRowMean),
            this.wsmSTD,
            this.wsmMin,
            this.minSTD,
            this.smdSTD,
            this.cspArr
        ];

        const idx = this.store.capture.save;
        this.store.capture.list[idx].cal = cal;
        this.store.capture.list[idx].show = this.getCSP(this.cspArr);

        if (this.store.capture.list[idx].mode == 'vehicle') {
            this.store.capture.vehicle++;
        }
        else if (this.store.capture.list[idx].mode == 'asc') {
            this.store.capture.asc++;
        }
        this.store.capture.save++;

        this.service.href('/capture');
    }
}
