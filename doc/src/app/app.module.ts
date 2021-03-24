import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgForComponent } from './ng-for/ng-for.component';
import { IfComponent } from './if/if.component';

@NgModule({
    declarations: [
        AppComponent,
        NgForComponent,
        IfComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
