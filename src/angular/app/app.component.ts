import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        public service: Service,
        public ref: ChangeDetectorRef,
        public router: Router,
    ) { }

    public async ngOnInit() {
        await this.service.init(this);
    }
}
