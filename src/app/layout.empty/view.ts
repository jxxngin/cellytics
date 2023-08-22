import { OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public ref: ChangeDetectorRef,
        public router: Router,
    ) { }

    public async ngOnInit() {
        await this.service.init(this);
    }
}
