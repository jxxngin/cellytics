import { OnInit, ChangeDetectorRef } from '@angular/core';

export class Component implements OnInit {
    private opacity: number = 0;

    constructor(
        public ref: ChangeDetectorRef,
    ) { }

    public async ngOnInit() { }

    private prevent(e) {
        e.preventDefault();
    }

    private render() {
        this.ref.detectChanges();
    }

    private close() {
        wiz.call("window-close");
    }
}