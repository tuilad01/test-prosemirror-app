import { NodeSpec } from 'prosemirror-model';

export const dynamicValueNodeName = 'dynamic_value';
export const dynamicValueNodeSpec: NodeSpec = {
  group: 'inline',
  inline: true,
  isolating: true,
  atom: true,
  attrs: {
    key: { default: null },
    value: { default: null },
  },
  parseDOM: [
    {
      tag: 'div.dynamic-value',
      getAttrs(dom) {
        const key = dom.getAttribute('data-key');
        const value = dom.getAttribute('data-value');
        return {
            key: key,
            value: value,
        };
      },
    },
  ],
  toDOM(node) {
    let { key, value } = node.attrs;
    const textContent = value ? value : key;
    return ['div', { class: 'dynamic-value', 'data-key': key, 'data-value': value }, textContent];
  },
};

