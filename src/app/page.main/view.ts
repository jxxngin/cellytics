import { OnInit } from '@angular/core';

export class Component implements OnInit {
    private mode = [
        { name: "Start", url: "/start", img: "image://start.svg" },
        { name: "History", url: "/history", img: "image://history.svg" },
        { name: "Setting", url: "/main", img: "image://setting.svg" },
    ];

    public async ngOnInit() {
    }
}