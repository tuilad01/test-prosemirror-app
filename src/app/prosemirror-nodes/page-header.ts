import { NodeSpec } from 'prosemirror-model';

export const headerNodeSpec: NodeSpec = {
  attrs: { class: { default: 'header' } },
  content: 'inline*',
  selectable: false,
  draggable: false,
  atom: true,

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
