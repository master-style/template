import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IfComponent } from './if/if.component';
import { NgForComponent } from './ng-for/ng-for.component';
import { TestComponent } from './test/test.component';

const routes: Routes = [
    {
        path: 'ng-for', component: NgForComponent
    },
    {
        path: 'if', component: IfComponent
    },
    {
        path: 'test', component: TestComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
