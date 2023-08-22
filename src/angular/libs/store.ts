import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Store {
    public cell = {
        name: "Dunallella tertio",
        grid: 4,
        threshold: 20,
    };
    public count = {
        result: null,
        img: null,
    };
    public toxicity = {
        control: [],
        test: [],
        name: "",
    };
    
    // custom
    public setting = {
        username: "",
        grid: 4,
        threshold: 20,
        led: 165,
        bgavg: 0,
    };
    public capture = {
        list: [],
        show: [],
        save: 0,
        vehicle: 0,
        asc: 0,
    };
    public result_id = "";
    
    constructor() { }
}

export default Store;
