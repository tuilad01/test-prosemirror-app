import { MarkSpec } from 'prosemirror-model';
export const fontSizeMark: MarkSpec = {
  attrs: {
    fontSize: { default: '16px' },
  },
  toDOM(node) {
    return ['span', { style: `font-size: ${node.attrs['fontSize']}` }, 0];
  },
  parseDOM: [
    {
      style: 'font-size',
      getAttrs(value) {
        return { fontSize: value };
      },
    },
  ],
};
