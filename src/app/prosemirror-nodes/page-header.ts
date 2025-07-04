import { NodeSpec } from 'prosemirror-model';

export const headerNodeName = 'page_header_2';
const className = 'page-header';

export const headerNodeSpec: NodeSpec = {
  attrs: { class: { default: className } },
  content: 'block*',
  group: 'block',

  toDOM: (node: any) => {
    return [
      'div',
      {
        class: className,
      },
      0,
    ];
  },

  parseDOM: [
    {
      tag: `div.${className}`,
    },
  ],
};
