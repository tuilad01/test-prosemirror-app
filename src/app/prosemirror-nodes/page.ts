import { Schema, DOMParser, NodeType, NodeSpec } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
// The supported types of dinosaurs.
// const dinos = [
//   'brontosaurus',
//   'stegosaurus',
//   'triceratops',
//   'tyrannosaurus',
//   'pterodactyl',
// ];

export const pageNodeSpec: NodeSpec = {
  // Dinosaurs have one attribute, their type, which must be one of
  // the types defined above.
  // Brontosaurs are still the default dino.
  attrs: { 'page-number': { default: '1' } },
  content: 'block+',
  // These nodes are rendered as images with a `dino-type` attribute.
  // There are pictures for all dino types under /img/dino/.
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
  // When parsing, such an image, if its type matches one of the known
  // types, is converted to a dino node.
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
