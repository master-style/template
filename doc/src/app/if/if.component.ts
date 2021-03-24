import { Component, OnInit } from '@angular/core';

import { Template } from '../../../../src';

@Component({
    selector: 'app-if',
    templateUrl: './if.component.html',
    styleUrls: ['./if.component.scss']
})
export class IfComponent implements OnInit {

    constructor() { }

    items = [1, 2, 3];
    items2 = [8, 9, 10];
    disabled = true;

    template = new Template(() => [
        'div', {
            $html: '<div class="shine">omg'
        },
        () => this.items.map((num) => [
            'div', {
                class: 'shine',
                $html: '<div class="shine">' + num
            }, [
                'div', {
                    $if: !this.disabled,
                    $text: 'x',
                    class: 'shine',
                    style: 'flex: 0 0 auto'
                },
                'div', {
                    $if: !this.disabled,
                    $text: 'o',
                    class: 'shine',
                    style: 'flex: 0 0 auto'
                },
            ]
        ]),
        [
            'div', {
                class: 'shine',
                $html: '<div class="shine">fuck'
            }
        ],
        () => this.items2.map((num) => [
            'div', {
                class: 'shine',
                $html: '<div class="shine">' + num
            }, [
                'div', {
                    $if: !this.disabled && num === 9,
                    $text: 'x',
                    class: 'shine',
                    style: 'flex: 0 0 auto'
                },
                'div', {
                    $if: !this.disabled,
                    $text: 'o',
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
        }, 1000);
    }

}
