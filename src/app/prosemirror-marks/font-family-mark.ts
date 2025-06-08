import { MarkSpec } from 'prosemirror-model';
export const fontFamilyMark: MarkSpec = {
  attrs: {
    fontFamily: { default: 'Times New Roman' },
  },
  toDOM(node) {
    return ['span', { style: `font-family: ${node.attrs['fontFamily']}` }, 0];
  },
  parseDOM: [
    {
      style: 'font-family',
      getAttrs(value) {
        return { fontFamily: value };
      },
    },
  ],
};
