import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-ng-for',
    templateUrl: './ng-for.component.html',
    styleUrls: ['./ng-for.component.scss']
})
export class NgForComponent implements OnInit {

    constructor() { }

    data: any[] = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
    ]

    index = 1;
    from = 1;
    to = 3;

    ngOnInit(): void {
    }

    insert() {
        this.data.splice(this.index, 0, { id: 'insert-' + new Date().getTime() });
    }

    insertNoneId() {
        this.data.splice(this.index, 0, { text: 'anonymous' });
    }

    push() {
        this.data.push({ id: 'push-' + new Date().getTime() })
    }

    splice() {
        this.data.splice(this.index, 1);
    }

    replace() {
        this.data.splice(this.index, 1, { id: 'replace-' + new Date().getTime() });
    }

    exchange() {
        const a = this.data[this.from];
        const b = this.data[this.to];
        this.data[this.to] = a;
        this.data[this.from] = b;
    }

    trackById(index, data) {
        return data.id;
    }

}
