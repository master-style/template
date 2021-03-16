
import { $ } from "@master/dom";

const fragment = document.createDocumentFragment();
const div = document.createElement('div');

export interface TemplateNode {
    tag: string;
    attributes?: { [key: string]: any };
    children?: TemplateNode[];
    element?: any;
    attr?: any;
    $on?: any;
    $html?: string;
    $text?: string;
    $if?: boolean;
    $css?: { [key: string]: any };
    $namespace?: string;
    $created?: <T extends Element>(element?: T, node?: TemplateNode) => void;
    $removed?: <T extends Element>(element?: T, node?: TemplateNode) => void;
    $updated?: <T extends Element>(element?: T, node?: TemplateNode) => void;
    $data?: any;
}

export class Template {

    constructor(
        private template: () => any[]
    ) { }

    container: any;
    nodes: TemplateNode[] = [];

    render(container) {

        if (!container) return;

        // tslint:disable-next-line: prefer-for-of
        const oldNodes: TemplateNode[] = this.nodes;
        this.nodes = [];

        (function generate(tokens: any[], eachNodes: TemplateNode[]) {
            let eachNode: TemplateNode;
            for (const token of tokens) {
                const tokenType = typeof token;
                if (tokenType === 'string') {
                    eachNode = {
                        tag: token,
                        children: null
                    };
                    eachNodes.push(eachNode);
                } else {
                    const hasIf = eachNode.hasOwnProperty('$if');
                    const whether = hasIf && eachNode.$if || !hasIf;
                    if (Array.isArray(token) && whether) {
                        if (!eachNode.children) eachNode.children = [];
                        generate(token, eachNode.children);
                    } else if (tokenType === 'function' && whether) {
                        let children = token();
                        if (!children) continue;
                        children = children.reduce((acc, eachToken) => {
                            return acc.concat(eachToken);
                        }, []);
                        if (!eachNode.children) eachNode.children = [];
                        generate(children, eachNode.children);
                    } else if (tokenType === 'object') {
                        const attr = token;
                        eachNode.attr = {};
                        for (const attrKey in attr) {
                            const eachAttrValue = attr[attrKey];
                            if (attrKey[0] !== '$') {
                                eachNode.attr[attrKey] = eachAttrValue;
                            } else {
                                eachNode[attrKey] = eachAttrValue;
                            }
                        }
                    }
                }
            }
        })(this.template(), this.nodes);

        if (this.nodes.length && this.container === container) {
            (function renderNodes(eachNodes, eachOldNodes, parent) {
                if (!eachNodes?.length && eachOldNodes?.length) {
                    removeNodes(eachOldNodes);
                } else {

                    // tslint:disable-next-line: prefer-for-of
                    if (eachOldNodes?.length > eachNodes?.length) {
                        removeNodes(eachOldNodes.splice(eachNodes?.length));
                    }

                    for (let i = 0; i < eachNodes?.length; i++) {
                        const eachNode = eachNodes[i];
                        const eachOldNode = eachOldNodes && eachOldNodes[i];
                        const existing = !!eachOldNode?.element;
                        const sameTag = eachNode.tag === eachOldNode?.tag;
                        const hasIf = eachNode.hasOwnProperty('$if');
                        const whether = hasIf && eachNode.$if || !hasIf;

                        if (
                            existing && !whether ||
                            existing && whether && !sameTag
                        ) {
                            removeNode(eachOldNode);
                        }

                        if (!whether) continue;

                        if (existing && sameTag) {

                            const element = eachNode.element = eachOldNode?.element;
                            const attr = eachNode.attr;
                            const oldAttr = eachOldNode?.attr;
                            const css = eachNode.$css;
                            const oldCss = eachOldNode?.$css;
                            const html = eachNode.$html;
                            const oldHtml = eachOldNode?.$html;
                            const htmlUpdated = '$html' in eachNode && html !== oldHtml;
                            const text = eachNode.$text;
                            const oldText = eachOldNode?.$text;
                            const textUpdated = '$text' in eachNode && text !== oldText;

                            if (oldAttr) {
                                for (const attrKey in oldAttr) {
                                    // 若新 attr 不應包含舊 attr
                                    if (!(attrKey in attr)) {
                                        element.removeAttribute(attrKey);
                                    }
                                }
                            }

                            if (attr) {
                                for (const attrKey in attr) {
                                    const value = attr[attrKey];
                                    const oldValue = oldAttr[attrKey];
                                    if (value !== oldValue) {
                                        element.attr(attrKey, value);
                                    }
                                }
                            }

                            for (const eachPropKey in css) {
                                const value = css[eachPropKey];
                                const oldValue = oldCss[eachPropKey];
                                if (value !== oldValue) {
                                    element.css(eachPropKey, value);
                                }
                            }

                            for (const eachEventType in eachOldNode?.$on) {
                                const eachHandle = eachOldNode.$on[eachEventType];
                                element.off(eachHandle);
                            }

                            for (const eachEventType in eachNode?.$on) {
                                const eachHandle = eachNode.$on[eachEventType];
                                element.on(eachEventType, eachHandle, {
                                    passive: true
                                });
                            }

                            if (htmlUpdated) {
                                element.innerHTML = html;
                            } else if (textUpdated) {
                                element.textContent = text;
                            }

                            if (
                                (htmlUpdated || textUpdated) && eachOldNode?.children
                            ) {
                                eachOldNode.children = [];
                            }

                            renderNodes(eachNode?.children, eachOldNode?.children, element);

                            eachNode.$updated?.(element, eachNode);
                        } else {
                            const element = eachNode.element = $(
                                eachNode.$namespace
                                    ? document.createElementNS(eachNode.$namespace, eachNode.tag)
                                    : eachNode.tag === 'div'
                                        ? div.cloneNode()
                                        : document.createElement(eachNode.tag)
                            );

                            eachNode.attr && element.attr(eachNode.attr);
                            eachNode.$css && element.css(eachNode.$css);

                            for (const eachEventType in eachNode?.$on) {
                                const eachHandle = eachNode.$on[eachEventType];
                                if (eachHandle) {
                                    element.on(eachEventType, eachHandle, {
                                        passive: true
                                    });
                                }
                            }

                            if ('$html' in eachNode) {
                                element.innerHTML = eachNode.$html;
                            } else if ('$text' in eachNode) {
                                element.textContent = eachNode.$text;
                            }

                            if (eachOldNode?.children) {
                                eachOldNode.children = [];
                            }

                            renderNodes(eachNode?.children, eachOldNode?.children, element);

                            eachNode.$created?.(element, eachNode);
                            eachNode.$updated?.(element, eachNode);

                            if (i === 0) {
                                parent.prepend(element);
                            } else {
                                const existedNode =
                                    eachNodes
                                        .slice(0, i)
                                        .reverse()
                                        .find((nearNode) => {
                                            const eachHasIf = nearNode.hasOwnProperty('$if');
                                            return (eachHasIf && nearNode.$if || !eachHasIf)
                                                && nearNode.element;
                                        });

                                if (existedNode) {
                                    existedNode.element.after(element);
                                } else {
                                    parent.prepend(element);
                                }
                            }
                        }
                    }
                }
            })(this.nodes, oldNodes, container);
        } else {
            this.container = container;
            (function create(eachNodes, parent) {
                const eachFragment = fragment.cloneNode();
                eachNodes.forEach((eachNode) => {

                    if (eachNode.hasOwnProperty('$if') && !eachNode.$if) return;

                    const element = eachNode.element = $(
                        eachNode.$namespace
                            ? document.createElementNS(eachNode.$namespace, eachNode.tag)
                            : eachNode.tag === 'div'
                                ? div.cloneNode()
                                : document.createElement(eachNode.tag)
                    )

                    eachNode.$created?.(element, eachNode);
                    eachNode.$updated?.(element, eachNode);

                    for (const eachEventType in eachNode.$on) {
                        const eachHandle = eachNode.$on[eachEventType];
                        element.on(eachEventType, eachHandle, {
                            passive: true
                        });
                    }

                    if ('$html' in eachNode) {
                        element.innerHTML = eachNode.$html;
                    } else if ('$text' in eachNode) {
                        element.textContent = eachNode.$text;
                    }

                    const attr = eachNode.attr;
                    const css = eachNode.$css;

                    attr && element.attr(attr);
                    css && element.css(css);

                    eachNode.children && create(eachNode.children, element);

                    eachFragment.appendChild(element);
                });
                parent.appendChild(eachFragment);
            })(this.nodes, container);
        }
    }

    remove() {
        if (this.nodes.length) {
            this.container = null;
            removeNodes(this.nodes);
            this.nodes = [];
        }
        return this;
    }
}

const removeNode = (node) => {
    if (!node?.element) return;
    node.element.remove();
    node.$removed?.(node.element, node);
};

const removeNodes = (eachNodes) => {
    if (!eachNodes) return;
    eachNodes
        .forEach((eachNode) => {
            removeNode(eachNode);
        });
};
