import { Component, OnInit } from '@angular/core';
import { Template } from '../../../../src';
import { CoreService } from '../core/core.service';

@Component({
    selector: 'app-test',
    templateUrl: './test.component.html',
    styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

    constructor(
        public coreService: CoreService
    ) { }

    data = [
        'div', { class: 'shine', $text: '1' },
        'div', { class: 'shine', $text: '2' },
        'div', { class: 'shine', $text: '3', $id: '3' },
        'div', { class: 'shine', $text: '4', $id: '4' },
        'div', { class: 'shine', $text: '5' }
    ];

    template = new Template(() => {
        return this.data;
    });

    index = 0;
    from = 1;
    to = 3;

    batching = false;
    actions = [];

    ngOnInit(): void {
        this.render();
    }

    insert() {
        const $id = 'insert-' + new Date().getTime();

        const index = this.index % 2
            ? this.index - 1
            : this.index;

        this.data.splice(index, 0, 'div');
        this.data.splice(index + 1, 0, { class: 'shine', $text: $id, $id });

        this.render();
    }

    insertNoneId() {
        const index = this.index % 2
            ? this.index - 1
            : this.index;

        this.data.splice(index, 0, 'div');
        this.data.splice(index + 1, 0, { class: 'shine', $text: 'no-id-insert-' + new Date().getTime().toString() });

        this.render();
    }

    push() {
        const $id = 'push-' + new Date().getTime();

        this.data.push(...['div', { class: 'shine', $text: $id, $id }]);

        this.render();
    }

    splice() {
        const index = this.index % 2
            ? this.index
            : this.index - 1;

        this.data.splice(index, 2);

        console.log(this.data);

        console.log(this.data);

        this.render();
    }

    replace() {
        const $id = 'replace-' + new Date().getTime();
        const index = this.index % 2
            ? this.index
            : this.index + 1;

        this.data.splice(index, 1, { class: 'shine', $text: $id });
        // console.log(this.data);
        this.render();
    }

    exchange() {
        const a = this.data[this.from];
        const b = this.data[this.to];
        this.data[this.to] = a;
        this.data[this.from] = b;

        this.render();
    }

    batch() {

    }

    render() {
        const container = document.querySelector('#create2');
        if (!this.batching) {
            this.coreService.performStart();
            this.template.render(container);
            this.coreService.performEnd();
            this.coreService.times ++;
        }
    }
}
