import { OnInit, Input, Output, EventEmitter } from '@angular/core';

export class Component implements OnInit {
    @Input() label: string = "";
    @Input() type: string = "text";
    @Input() model: any;
    @Input() disabled: boolean = false;
    @Output() modelChange = new EventEmitter();
    @Output() enter = new EventEmitter();

    public async ngOnInit() { }

    private onEnter () {
        if (!this.enter) return;
        this.enter.emit();
    }
}