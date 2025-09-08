import { NodeSpec } from 'prosemirror-model';
const className = 'page-break';
export const pageBreakNodeName = 'page_break';
export const pageBreakNodeSpec: NodeSpec = {
  attrs: { class: { default: className } },
  group: 'block',
  atom: true,

  toDOM: (node: any) => {
    return [
      'div',
      {
        class: className,
      },
    ];
  },

  parseDOM: [
    {
      tag: `div.${className}`,
    },
  ],
};
