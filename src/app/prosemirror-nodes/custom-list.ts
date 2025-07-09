import { src as lionSrc } from '@app/data/lion';
import { NodeSpec, Node } from 'prosemirror-model';
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
} from 'prosemirror-view';
import { Selection } from 'prosemirror-state';

export const className = 'custom-list-node';
export const customListNodeName = 'custom_list';
export const customListNodeSpec: NodeSpec = {
  group: 'block',
  content: 'custom_list_item+',
  attrs: {
    column: { default: 1 },
  },
  parseDOM: [
    {
      tag: `div.${className}`,
      getAttrs(dom) {
        return {
          column: dom.style?.gridTemplateColumns?.split(' ')?.length ?? 1,
        };
      },
    },
  ],
  toDOM(node) {
    let { column } = node.attrs;
    const style =
      'display: grid;' +
      (' grid-template-columns: ' +
        Array(column)
          .fill(0)
          .reduce((prev) => prev + ' 1fr', '') +
        ';');
    return ['div', { class: className, column, style }, 0];
  },
};

// export class customListNodeView implements NodeView {
//   dom: HTMLElement;
//   contentDOM: HTMLElement; // This will be the grid container where child list items live

//   constructor(
//     public node: Node,
//     public view: EditorView,
//     public getPos: () => number | undefined
//   ) {
//     this.dom = document.createElement('div');
//     this.dom.classList.add(className); // Reuse your class name if it's the same

//     // Set attributes and style based on node.attrs, similar to your toDOM
//     const { column } = node.attrs;
//     const style =
//       'display: grid;' +
//       (' grid-template-columns: ' +
//         Array(column)
//           .fill(0)
//           .reduce((prev) => prev + ' 1fr', '') +
//         ';');
//     this.dom.setAttribute('style', style); // Apply the style
//     this.dom.setAttribute('column', column.toString()); // For debugging/inspection

//     // ProseMirror will manage the children here.
//     // This is where ProseMirror expects to find the editable content (the custom_list_item nodes).
//     this.contentDOM = this.dom; // In this case, the dom itself *is* the contentDOM
//   }

//   update(node: Node): boolean {
//     // Only re-render if the column attribute changes
//     if (node.type.name !== customListNodeName) return false;
//     if (node.attrs['column'] !== this.node.attrs['column']) {
//       const { column } = node.attrs;
//       const style =
//         'display: grid;' +
//         (' grid-template-columns: ' +
//           Array(column)
//             .fill(0)
//             .reduce((prev) => prev + ' 1fr', '') +
//           ';');
//       this.dom.setAttribute('style', style);
//       this.dom.setAttribute('column', column.toString());
//     }
//     this.node = node;
//     return true; // We handled the update
//   }

// No destroy method usually needed if contentDOM == dom and no custom event listeners
//}
