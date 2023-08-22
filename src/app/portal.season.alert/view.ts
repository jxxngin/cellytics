import { OnInit, Input, HostListener } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    @Input() model: any = null;

    constructor(public service: Service) {
        if (!this.model) this.model = service.alert;
    }

    @HostListener('window:keydown.escape', ['$event'])
    public handler_esc(e) {
        if (!this.model) return false;
        if (!this.model.isshow) return false;
        this.model.hide();
    }

    @HostListener('window:keydown.enter', ['$event'])
    public handler_enter(e) {
        if (!this.model) return false;
        if (!this.model.isshow) return false;
        if (document.activeElement) {
            e.preventDefault();
            document.activeElement.blur();
        }
        if (this.model.opts.action) this.model.action();
        else this.model.hide();
    }

    public async ngOnInit() { }
}