import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-ng-for',
    templateUrl: './ng-for.component.html',
    styleUrls: ['./ng-for.component.scss']
})
export class NgForComponent implements OnInit {

    constructor() { }

    data: any = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
    ]

    ngOnInit(): void {
    }

    insert() {
        this.data.splice(1, 0, { id: 'insert-' + new Date().getTime() });
    }

    push() {
        this.data.push({ id: 'push-' + new Date().getTime() })
    }

    splice() {
        this.data.splice(1, 1);
    }

    replace() {
        this.data.splice(2, 1, { id: 'replace-' + new Date().getTime() });
    }


}
