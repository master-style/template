import { Component, OnInit } from '@angular/core';

import { Template } from '../../../../src';

@Component({
    selector: 'app-if',
    templateUrl: './if.component.html',
    styleUrls: ['./if.component.scss']
})
export class IfComponent implements OnInit {

    constructor() { }

    items = [1, 2, 3, 4, 5];
    disabled = true;

    template = new Template(() => [
        'div',
        () => this.items.map((item) => [
            'div', { class: 'shine' }, [
                'div', {
                    $text: item,
                    class: 'shine'
                },
                'div', {
                    $if: !this.disabled,
                    $text: 'x',
                    class: 'shine',
                    style: 'flex: 0 0 auto'
                },
            ]
        ])
    ])

    ngOnInit(): void {
        this.template.render(document.getElementById('if'));

        setTimeout(() => {
            this.disabled = false;
            this.template.render(document.getElementById('if'));
        }, 500);
    }

}
