
import { $ } from "@master/dom";

const fragment = document.createDocumentFragment();
const div = document.createElement('div');

enum Tag {
    DIV = 'div',
    SVG = 'svg',
    TEXT = '$text'
}

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
                    const isTextNode = eachNode.tag === '$text';
                    if (Array.isArray(token) && whether && !isTextNode) {
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

        if (this.container === container) {
            const operators = (function simulation(index, parentNode, nodes, oldNodes, operators, removedIdNodes) {
                const existedOldNodes = oldNodes
                    ? oldNodes.filter(eachOldNode => eachOldNode.element)
                    : [];
                const ifNodes = nodes
                    ? nodes.filter(eachNode => !eachNode.hasOwnProperty('$if') || eachNode.$if)
                    : [];

                // 移除不存在的舊有 $id 元素
                for (let i = existedOldNodes.length - 1; i >= 0; i--) {
                    if (existedOldNodes[i].$id && existedOldNodes[i].element) {
                        const existedIfNode = ifNodes?.find(eachIfNode => eachIfNode.$id === existedOldNodes[i].$id);
                        if (!existedIfNode || existedIfNode.tag !== existedOldNodes[i].tag) {
                            removeElementByNode(existedOldNodes[i]);
                            existedOldNodes.splice(i, 1);
                        }
                    }
                }

                operators = [...operators];
                removedIdNodes = [...removedIdNodes];

                // console.log('PARENT NODE', parentNode);
                // console.log('NODES', nodes);
                // console.log('OLD NODES', oldNodes);

                function insertElement(index, parentNode, node, oldNode, oldIdElement, nodes, oldNodes, operators) {
                    if (!oldIdElement) {
                        oldIdElement = $(
                            node.$namespace
                                ? document.createElementNS(node.$namespace, node.tag)
                                : node.tag === Tag.DIV
                                    ? div.cloneNode()
                                    : node.tag === Tag.TEXT
                                        ? document.createTextNode(node.$text)
                                        : document.createElement(node.tag));
                    }

                    node.element = oldIdElement;

                    operators.push({ action: 'ADD', oldIdElement, index, node, parent: parentNode, nodes });
                    oldNodes.splice(index, 0, node);

                    if (node.tag !== '$text') {
                        operators.push(
                            ...simulation(
                                0, 
                                oldIdElement ?? oldNode.element,
                                node?.children,
                                oldNode?.children,
                                [],
                                []));
                    }
                }

                function changeElement(node, oldNode, operators) {
                    operators.push({ action: 'CHANGE', node: node, oldNode: oldNode });

                    if (node.tag !== '$text') {
                        operators.push(
                            ...simulation(
                                0, 
                                oldNode.element,
                                node?.children,
                                oldNode?.children,
                                [],
                                []));
                    }
                }

                for (let i = index; i < ifNodes.length; i++) {
                    const eachIfNode = ifNodes[i],
                        eachExistedOldNode = existedOldNodes[i],
                        sameTag = eachIfNode.tag === eachExistedOldNode?.tag,
                        sameId = eachIfNode.$id === eachExistedOldNode?.$id;

                    // console.log('I', i);
                    // console.log('新元素', eachIfNode);
                    // console.log('舊元素', eachExistedOldNode);

                    if (eachExistedOldNode) {
                        if (eachIfNode?.$id) {
                            if (!sameId) {
                                const existedOldNodeIndex = existedOldNodes.findIndex(eachExistedOldNode => eachExistedOldNode.$id === eachIfNode.$id);
                                if (existedOldNodeIndex !== -1) {
                                    const existedOldNode = existedOldNodes[existedOldNodeIndex];
                                    if (eachExistedOldNode.$id) {
                                        // 待實作刪除舊有 $id 的模擬
                                        // console.log('插入新 $id 元素');
                                        operators.push({ action: 'REMOVE', oldNode: existedOldNode });
                                        existedOldNodes.splice(existedOldNodeIndex, 1);
                                    } else {
                                        // console.log('(情況1) 移除舊有非 $id 元素');
                                        const cloneExistedOldNodes = [...existedOldNodes];
                                        const cloneOperators = [...operators];
                                        while (true) {
                                            if (!cloneExistedOldNodes[i] || cloneExistedOldNodes[i].$id) {
                                                break;
                                            }

                                            cloneOperators.push({ action: 'DELETE', oldNode: cloneExistedOldNodes[i] });
                                            cloneExistedOldNodes.splice(i, 1);
                                        }
                                        const operatorResult = simulation(i, parentNode, ifNodes, cloneExistedOldNodes, cloneOperators, removedIdNodes);

                                        // console.log('(情況2) 移除並插入舊有 $id 元素');
                                        const cloneExistedOldNodes2 = [...existedOldNodes];
                                        const cloneOperators2 = [...operators];
                                        cloneOperators2.push({ action: 'REMOVE', oldNode: existedOldNode });
                                        cloneExistedOldNodes2.splice(existedOldNodeIndex, 1);
                                        insertElement(i, parentNode, eachIfNode, existedOldNode, existedOldNode.element, ifNodes, cloneExistedOldNodes2, cloneOperators2);
                                        const operatorResult2 = simulation(i + 1, parentNode, ifNodes, cloneExistedOldNodes2, cloneOperators2, removedIdNodes);

                                        return operatorResult.filter(eachOperatorResult => eachOperatorResult.action === 'ADD').length > operatorResult2.filter(eachOperatorResult2 => eachOperatorResult2.action === 'ADD').length
                                            ? operatorResult2
                                            : operatorResult;
                                    }
                                } else {
                                    const removedIdNodeIndex = removedIdNodes.findIndex(eachRemovedIdNode => eachRemovedIdNode.$id === eachIfNode.$id);
                                    if (removedIdNodeIndex !== -1) {
                                        // console.log('(情況3) 插入已刪除的舊有 $id 元素');
                                        const removeIdNode = removedIdNodes[removedIdNodeIndex];
                                        insertElement(i, parentNode, eachIfNode, removeIdNode, removeIdNode.element, ifNodes, existedOldNodes, operators);
                                        removedIdNodes.splice(removedIdNodeIndex, 1);
                                        continue;
                                    }
                                }
                            }
                        } else {
                            if (eachExistedOldNode.$id) {
                                // console.log('(情況4) 移除舊有 $id 元素');
                                const cloneExistedOldNodes = [...existedOldNodes];
                                const cloneOperators = [...operators];
                                cloneOperators.push({ action: 'REMOVE', oldNode: eachExistedOldNode });
                                cloneExistedOldNodes.splice(i, 1);
                                removedIdNodes.push(eachExistedOldNode);
                                const operatorResult = simulation(i, parentNode, ifNodes, cloneExistedOldNodes, cloneOperators, removedIdNodes);

                                // console.log('(情況5) 插入新非 $id 元素');
                                const cloneExistedOldNodes2 = [...existedOldNodes];
                                const cloneOperators2 = [...operators];
                                insertElement(i, parentNode, eachIfNode, null, null, ifNodes, cloneExistedOldNodes2, cloneOperators2);
                                const operatorResult2 = simulation(i + 1, parentNode, ifNodes, cloneExistedOldNodes2, cloneOperators2, removedIdNodes);

                                return operatorResult.filter(eachOperatorResult => eachOperatorResult.action === 'ADD').length > operatorResult2.filter(eachOperatorResult2 => eachOperatorResult2.action === 'ADD').length
                                    ? operatorResult2
                                    : operatorResult;
                            } else if (eachExistedOldNode.tag !== eachIfNode.tag) {
                                // console.log('(情況6) 在非 $id 元素前插入新非 $id 元素');
                                const cloneExistedOldNodes = [...existedOldNodes];
                                const cloneOperators = [...operators];
                                insertElement(i, parentNode, eachIfNode, null, null, ifNodes, cloneExistedOldNodes, cloneOperators);
                                const operatorResult = simulation(i + 1, parentNode, ifNodes, cloneExistedOldNodes, cloneOperators, removedIdNodes);

                                // console.log('(情況7) 移除舊有非 $id 且 tag 不同元素');
                                const cloneExistedOldNodes2 = [...existedOldNodes];
                                const cloneOperators2 = [...operators];
                                cloneOperators2.push({ action: 'DELETE', oldNode: eachExistedOldNode });
                                cloneExistedOldNodes2.splice(i, 1);
                                const operatorResult2 = simulation(i, parentNode, ifNodes, cloneExistedOldNodes2, cloneOperators2, removedIdNodes);

                                return operatorResult.filter(eachOperatorResult => eachOperatorResult.action === 'ADD').length > operatorResult2.filter(eachOperatorResult2 => eachOperatorResult2.action === 'ADD').length
                                    ? operatorResult2
                                    : operatorResult;
                            } else if (eachExistedOldNode.children?.length || eachIfNode.children?.length) {
                                // console.log('(情況8) 插入新非 $id 元素');
                                const cloneExistedOldNodes = [...existedOldNodes];
                                const cloneOperators = [...operators];
                                insertElement(i, parentNode, eachIfNode, null, null, ifNodes, cloneExistedOldNodes, cloneOperators);
                                const operatorResult = simulation(i + 1, parentNode, ifNodes, cloneExistedOldNodes, cloneOperators, removedIdNodes);

                                // console.log('(情況9) 覆蓋原有非 $id 元素');
                                const cloneExistedOldNodes2 = [...existedOldNodes];
                                const cloneOperators2 = [...operators];
                                changeElement(eachIfNode, eachExistedOldNode, cloneOperators2);
                                const operatorResult2 = simulation(i + 1, parentNode, ifNodes, cloneExistedOldNodes2, cloneOperators2, removedIdNodes);

                                return operatorResult.filter(eachOperatorResult => eachOperatorResult.action === 'ADD').length > operatorResult2.filter(eachOperatorResult2 => eachOperatorResult2.action === 'ADD').length
                                    ? operatorResult2
                                    : operatorResult;
                            }
                        }
                    }

                    if (sameTag && sameId) {
                        changeElement(eachIfNode, eachExistedOldNode, operators);
                    } else {
                        insertElement(i, parentNode, eachIfNode, null, null, ifNodes, existedOldNodes, operators);
                    }
                }

                for (let i = ifNodes.length; i < existedOldNodes.length; i++) {
                    operators.push({ action: 'DELETE', oldNode: existedOldNodes[i] });
                }

                return operators;
            })(0, container, this.nodes, oldNodes, [], []);
            // console.log(operators);

            for (const eachOperator of operators) {
                switch (eachOperator.action) {
                    case 'ADD':
                        const newElement = eachOperator.node.element = eachOperator.oldIdElement;

                        if (eachOperator.node.tag !== '$text') {
                            eachOperator.node.attr && newElement.attr(eachOperator.node.attr);
                            eachOperator.node.$css && newElement.css(eachOperator.node.$css);

                            for (const eachEventType in eachOperator.node?.$on) {
                                const eachHandle = eachOperator.node.$on[eachEventType];
                                if (eachHandle) {
                                    newElement.on(eachEventType, eachHandle, {
                                        passive: true
                                    });
                                }
                            }

                            if ('$html' in eachOperator.node) {
                                newElement.innerHTML = eachOperator.node.$html;
                            } else if ('$text' in eachOperator.node) {
                                newElement.textContent = eachOperator.node.$text;
                            }
                        }

                        eachOperator.node.$created?.(newElement, eachOperator.node);
                        eachOperator.node.$updated?.(newElement, eachOperator.node);

                        if (eachOperator.index === 0) {
                            eachOperator.parent.prepend(newElement);
                        } else {
                            const existedElement =
                                eachOperator.nodes
                                    .slice(0, eachOperator.index)
                                    .reverse()
                                    [0]
                                    ?.element;

                            if (existedElement) {
                                existedElement.after(newElement);
                            } else {
                                eachOperator.parent.prepend(newElement);
                            }
                        }

                        break;
                    case 'CHANGE':
                        const element = eachOperator.node.element = eachOperator.oldNode.element;

                        const text = eachOperator.node.$text;
                        const oldText = eachOperator.oldNode?.$text;
                        const oldOn = eachOperator.oldNode.$on;

                        if (eachOperator.node.tag === '$text') {
                            element.textContent = text;
                        } else {
                            const attr = eachOperator.node.attr;
                            const oldAttr = eachOperator.oldNode?.attr;
                            const css = eachOperator.node.$css;
                            const oldCss = eachOperator.oldNode?.$css;
                            const html = eachOperator.node.$html;
                            const oldHtml = eachOperator.oldNode?.$html;
                            const htmlUpdated = '$html' in eachOperator.node && html !== oldHtml;
                            const textUpdated = '$text' in eachOperator.node && text !== oldText;
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
                            if (!('$html' in eachOperator.node) && ('$html' in eachOperator.oldNode)) {
                                element.innerHTML = '';
                            } else if (!('$text' in eachOperator.node) && ('$text' in eachOperator.oldNode)) {
                                element.textContent = '';
                            }

                            if (attr) {
                                for (const attrKey in attr) {
                                    const value = attr[attrKey];
                                    const oldValue = oldAttr?.[attrKey];
                                    if (value !== oldValue) {
                                        element.attr(attrKey, value);
                                    }
                                }
                            }

                            for (const propKey in css) {
                                const value = css[propKey];
                                const oldValue = oldCss?.[propKey];
                                if (value !== oldValue) {
                                    element.css(propKey, value);
                                }
                            }

                            if (htmlUpdated) {
                                element.innerHTML = html;
                            } else if (textUpdated) {
                                element.textContent = text;
                            }
                        }

                        // clear
                        for (const eventType in oldOn) {
                            const eachHandle = oldOn[eventType];
                            element.off(eachHandle);
                        }

                        for (const eachEventType in eachOperator.node.$on) {
                            const eachHandle = eachOperator.node.$on[eachEventType];
                            element.on(eachEventType, eachHandle, {
                                passive: true
                            });
                        }

                        eachOperator.node.$updated?.(element, eachOperator.node);

                        break;
                    case 'DELETE':
                        removeElementByNode(eachOperator.oldNode);
                        break;
                    case 'REMOVE':
                        eachOperator.oldNode.element.remove();
                        break;
                }
            }
        } else {
            this.container = container;
            (function create(eachNodes, parent) {
                const eachFragment = fragment.cloneNode();
                eachNodes.forEach((eachNode) => {

                    if (eachNode.hasOwnProperty('$if') && !eachNode.$if) return;

                    const element = eachNode.element = $(
                        eachNode.$namespace
                            ? document.createElementNS(eachNode.$namespace, eachNode.tag)
                            : eachNode.tag === Tag.DIV
                                ? div.cloneNode()
                                : eachNode.tag === Tag.TEXT
                                    ? document.createTextNode(eachNode.$text)
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
            removeElementsByNodes(this.nodes);
            this.nodes = [];
        }
        return this;
    }
}

const removeElementByNode = (node) => {
    if (!node?.element) return;
    node.element.remove();
    node.$removed?.(node.element, node);
};

const removeElementsByNodes = (eachNodes) => {
    if (!eachNodes) return;
    eachNodes
        .forEach((eachNode) => {
            removeElementByNode(eachNode);
        });
};
