import { OnInit } from "@angular/core";
import { Service } from "@wiz/libs/portal/season/service";
import Store from "@wiz/libs/store";

export class Component implements OnInit {
    private name = "";

    constructor(
        public service: Service,
        public store: Store,
    ) { }

    public async ngOnInit() {
        setTimeout(async () => {
            const inputEl = document.querySelector("#input");
            inputEl.focus();
        }, 300)
        this.name = this.store.setting.username;
        await this.service.render();
    }

    private async edit(name) {
        if (name.length === 0) {
            this.service.toast.error("이름을 입력해주세요.");
            return;
        }
        this.store.setting.username = name;
        await this.service.render();
    }
}
