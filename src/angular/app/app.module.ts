import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgChartsModule } from "ng2-charts";

@NgModule({
    declarations: [
        '@wiz.declarations'
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        NgChartsModule,
        '@wiz.imports'
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }