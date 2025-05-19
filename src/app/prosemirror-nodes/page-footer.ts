import { NodeSpec } from 'prosemirror-model';

export const footerNodeSpec: NodeSpec = {
  attrs: { class: { default: 'footer' } },
  content: 'inline*',
  selectable: false,
  draggable: false,
  atom: true,

  toDOM: (node: any) => {
    return [
      'div',
      {
        class: 'footer',
      },
      0,
    ];
  },

  parseDOM: [
    {
      tag: 'div.footer',
      getAttrs: (dom: HTMLElement) => {
        const text = dom.textContent;
        return { text };
      },
    },
  ],
};
