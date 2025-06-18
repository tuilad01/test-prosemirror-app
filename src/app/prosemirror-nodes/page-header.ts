import { NodeSpec } from 'prosemirror-model';

export const headerNodeSpec: NodeSpec = {
  attrs: { class: { default: 'header' } },
  content: 'block*',

  toDOM: (node: any) => {
    return [
      'div',
      {
        class: 'header',
      },
      0,
    ];
  },

  parseDOM: [
    {
      tag: 'div.header',
      getAttrs: (dom: HTMLElement) => {
        const text = dom.textContent;
        return { text };
      },
    },
  ],
};
