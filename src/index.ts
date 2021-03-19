
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
    $id?: string;
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
                const eachIfNodes = eachNodes?.filter(eachNode => {
                    const hasIf = eachNode.hasOwnProperty('$if');
                    return hasIf && eachNode.$if || !hasIf;
                });

                const eachIfOldNodes = eachOldNodes?.filter(eachOldNode => {
                    const hasIf = eachOldNode.hasOwnProperty('$if');
                    return hasIf && eachOldNode.$if || !hasIf;
                });

                console.log(eachIfNodes);
                console.log(eachIfOldNodes);

                if (!eachIfNodes?.length && eachIfOldNodes?.length) {
                    removeNodes(eachIfOldNodes);
                } else {
                    let changedIndex = 0;
                    for (let i = 0; i < eachIfNodes?.length; i++) {
                        const eachNode = eachIfNodes[i];
                        let eachOldNode, existing, sameTag, sameId, oldElement;

                        const reloadParams = () => {
                            eachOldNode = eachIfOldNodes && eachIfOldNodes[i - changedIndex];
                            existing = !!eachOldNode?.element;
                            sameTag = eachNode.tag === eachOldNode?.tag;
                            sameId = !eachOldNode?.$id || (eachNode.$id === eachOldNode.$id);
                            oldElement = undefined;

                            if (eachNode.$id && !sameId) {
                                const oldNode = eachIfOldNodes.find(eachIfOldNode => eachIfOldNode.$id === eachNode.$id);
                                if (oldNode) {
                                    oldElement = oldNode.element;
                                }
                            }
                        };
                        reloadParams();

                        if (eachOldNode?.$id && !sameId) {
                            const node = eachIfNodes.find(eachIfNode => eachIfNode.$id === eachOldNode.$id);
                            if (!node) {
                                removeNode(eachOldNode);
                                changedIndex--;
                                reloadParams();
                            }
                        }

                        if (existing && !sameTag) {
                            removeNode(eachOldNode);
                        }

                        if (existing && sameTag && !oldElement && sameId) {
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
                            const oldOn = eachOldNode.$on;

                            // clear
                            if (oldAttr) {
                                for (const attrKey in oldAttr) {
                                    if (!(attrKey in attr)) {
                                        element.removeAttribute(attrKey);
                                    }
                                }
                            }

                            // clear
                            if (oldCss) {
                                for (const propKey in oldCss) {
                                    if (!(propKey in css)) {
                                        element.style.removeProperty(propKey);
                                    }
                                }
                            }

                            // clear
                            for (const eventType in oldOn) {
                                const eachHandle = oldOn[eventType];
                                element.off(eachHandle);
                            }

                            // clear
                            if (!('$html' in eachNode) && ('$html' in eachOldNode)) {
                                element.innerHTML = '';
                            } else if (!('$text' in eachNode) && ('$text' in eachOldNode)) {
                                element.textContent = '';
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

                            for (const propKey in css) {
                                const value = css[propKey];
                                const oldValue = oldCss[propKey];
                                if (value !== oldValue) {
                                    element.css(propKey, value);
                                }
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

                            renderNodes(
                                eachNode?.children,
                                eachOldNode?.children, 
                                element);

                            eachNode.$updated?.(element, eachNode);
                        } else {
                            let element;
                            if (oldElement) {
                                element = eachNode.element = oldElement;
                            } else {
                                element = eachNode.element = $(
                                    eachNode.$namespace
                                        ? document.createElementNS(eachNode.$namespace, eachNode.tag)
                                        : eachNode.tag === 'div'
                                            ? div.cloneNode()
                                            : document.createElement(eachNode.tag));
                                changedIndex++;
                            }

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

                    // if (eachIfOldNodes?.length > eachIfNodes?.length) {
                    //     removeNodes(eachIfOldNodes.splice(eachIfNodes?.length));
                    // }
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
