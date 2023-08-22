import { OnInit, ChangeDetectorRef } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    public loading: boolean = false;

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef,
    ) { }

    public async ngOnInit() {
        await this.service.init();
    }
}
