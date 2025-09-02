import { NodeSpec } from 'prosemirror-model';

export const contentNodeSpec: NodeSpec = {
  attrs: { class: { default: 'content' } },
  content: 'block+',

  toDOM: (node: any) => {
    return [
      'div',
      {
        class: 'content',
      },
      0,
    ];
  },

  parseDOM: [
    {
      tag: 'div.content',
      getAttrs: (dom: HTMLElement) => {
        const text = dom.textContent;
        return { text };
      },
    },
  ],
};
