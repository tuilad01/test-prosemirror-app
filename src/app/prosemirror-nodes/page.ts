import { Schema, DOMParser, NodeType, NodeSpec } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
export const pageNodeSpec: NodeSpec = {
  attrs: { 'page-number': { default: '1' } },
  content: 'block+',

  toDOM: (node: any) => {
    return [
      'div',
      {
        'page-number': node.attrs['page-number'],
        class: 'page',
      },
      0,
    ];
  },

  parseDOM: [
    {
      tag: 'div.page',
      getAttrs: (dom: HTMLElement) => {
        let pageNumber = dom.getAttribute('page-number');
        return pageNumber ? { pageNumber } : false;
      },
    },
  ],
};
