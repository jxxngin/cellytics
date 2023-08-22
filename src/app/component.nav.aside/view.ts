import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }
    public async ngOnInit() {
        await this.service.init();
        await this.service.render();
    }

    private async logout() {
        const { code } = await wiz.api("api/logout", {}, true);
        if (code !== 200) {
            notice.error("SERVER ERROR");
        }
        wiz.setToken(null);
        document.querySelector(".tologin").click();
    }
}
