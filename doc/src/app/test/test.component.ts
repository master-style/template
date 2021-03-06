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
        'div', { class: 'shine', $text: '3 🔑', $id: '3' },
        'div', { class: 'shine', $text: '4 🔑', $id: '4' },
        '$text', { $text: 'text node' },
        'div', { class: 'shine', $text: '5' },
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
            ? this.index + 1
            : this.index;

        const action = () => {
            this.data.splice(index, 0, 'div');
            this.data.splice(index + 1, 0, { class: 'shine', $text: $id + ' 🔑', $id });
        }

        if (this.batching) {
            this.actions.push({
                name: 'INSERT ID',
                params: [index],
                action
            });
        } else {
            action();
            this.render();
        }
    }

    insertNoneId() {
        const index = this.index % 2
            ? this.index + 1
            : this.index;

        const action = () => {
            this.data.splice(index, 0, 'div');
            this.data.splice(index + 1, 0, { class: 'shine', $text: 'no-id-insert-' + new Date().getTime().toString() });
        };

        if (this.batching) {
            this.actions.push({
                name: 'INSERT',
                params: [index],
                action
            });
        } else {
            action();
            this.render();
        }
    }

    push() {
        const $id = 'push-' + new Date().getTime();

        const action = () => {
            this.data.push(...['div', { class: 'shine', $text: $id, $id }]);
        };

        if (this.batching) {
            this.actions.push({
                name: 'PUSH',
                params: [],
                action
            });
        } else {
            action();
            this.render();
        }
    }

    splice() {
        const index = this.index % 2
            ? this.index - 1
            : this.index;

        const action = () => {
            this.data.splice(index, 2);
        };

        if (this.batching) {
            this.actions.push({
                name: 'SPLICE',
                params: [index],
                action
            });
        } else {
            action();
            this.render();
        }
    }

    replace() {
        const $id = 'replace-' + new Date().getTime();
        const index = this.index % 2
            ? this.index
            : this.index + 1;

        const action = () => {
            this.data.splice(index, 1, { class: 'shine', $text: $id });
        };

        if (this.batching) {
            this.actions.push({
                name: 'REPLACE',
                params: [index],
                action
            });
        } else {
            action();
            this.render();
        }
    }

    exchange() {
        const action = () => {
            const a = this.data[this.from];
            const b = this.data[this.to];
            this.data[this.to] = a;
            this.data[this.from] = b;
        };

        if (this.batching) {
            this.actions.push({
                name: 'EXCHANGE',
                params: [this.from, this.to],
                action
            });
        } else {
            action();
            this.render();
        }
    }

    batch() {
        for (const eachAction of this.actions) {
            eachAction.action();
        }

        console.log(this.data);

        this.render();
    }

    render() {
        const container = document.querySelector('#create2');
        this.coreService.performStart();
        this.template.render(container);
        this.coreService.performEnd();
        this.coreService.times++;
    }
}
