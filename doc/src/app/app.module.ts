import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgForComponent } from './ng-for/ng-for.component';
import { IfComponent } from './if/if.component';
import { FormsModule } from '@angular/forms';
import { FormModule } from '@master/angular';

@NgModule({
    declarations: [
        AppComponent,
        NgForComponent,
        IfComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        FormModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
