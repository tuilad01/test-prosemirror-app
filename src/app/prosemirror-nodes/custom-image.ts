import {
  DOMSerializer,
  Node as ProsemirrorNode,
  NodeSpec,
} from 'prosemirror-model';
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
  ViewMutationRecord,
} from 'prosemirror-view';
import { ResizableNodeView } from 'prosemirror-resizable-view';

export const customImageNode: NodeSpec = {
  inline: true,
  attrs: {
    src: { validate: 'string' },
    alt: { default: null, validate: 'string|null' },
    title: { default: null, validate: 'string|null' },
    width: { default: null },
    height: { default: null },
  },
  group: 'inline',
  draggable: true,
  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs(dom) {
        return {
          src: dom.getAttribute('src'),
          title: dom.getAttribute('title'),
          alt: dom.getAttribute('alt'),
          width: dom.getAttribute('width'),
          height: dom.getAttribute('height'),
        };
      },
    },
  ],
  toDOM(node) {
    let { src, alt, title, width, height } = node.attrs;
    return ['img', { src, alt, title, width, height }];
  },
};

// export class CustomImageNodeView implements NodeView {
//   dom!: HTMLElement;

//   constructor(
//     node: Node,
//     view: EditorView,
//     getPos: () => number | undefined,
//     decorations: readonly Decoration[]
//   ) {
//     console.log('custome image constructor');
//     console.log(node);
//     const domSerializer = DOMSerializer.fromSchema(view.state.schema);
//     console.log(domSerializer.serializeNode(node));
//     this.dom = document.createElement('div');
//     this.dom.textContent = 'hello';
//   }

//   update(node: Node, decorations: readonly Decoration[]): boolean {
//     console.log('update run');
//     if (node.type.name !== 'image') {
//       return false;
//     }

//     return true;
//   }

//   destroy() {
//     console.log('destroy run');
//   }
// }

/**
 * ResizableImageView is a NodeView for image. You can resize the image by
 * dragging the handle over the image.
 */
export class ResizableImageView extends ResizableNodeView implements NodeView {
  innerView: EditorView;

  constructor(
    node: ProsemirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    decoraction: readonly Decoration[]
  ) {
    super({ node, view, getPos: () => getPos() || 0 });
    this.innerView = view;
  }

  override createElement(props: {
    node: ProsemirrorNode;
    view: EditorView;
    getPos: () => number;
  }): HTMLElement {
    console.log('createElement');
    const inner = document.createElement('img');
    inner.setAttribute('src', props.node.attrs['src']);
    inner.style.width = '100%';
    inner.style.minWidth = '50px';
    inner.style.objectFit = 'contain'; // maintain image's aspect ratio

    // inner.addEventListener('drag', () => {
    //   console.log('drag end');
    // });

    return inner;
  }

  override update(node: ProsemirrorNode): boolean {
    console.log('update', this.dom, 'node', node);
    // const [width, height] = this.dom.style.aspectRatio.split(' / ');
    // this.innerView.state.tr.setDocAttribute(1, width: width, height: height})
    // if (node.type.name !== 'image') {
    //   return false;
    // }

    return true;
  }

  override destroy(): void {
    console.log('destroy', this.dom);
  }
}
