import { src as lionSrc } from '@app/data/lion';
import { NodeSpec, Node } from 'prosemirror-model';
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
} from 'prosemirror-view';
import { Selection } from 'prosemirror-state';

export const imageBlockNodeName = 'image_block';
export const imageBlockNodeSpec: NodeSpec = {
  group: 'block',
  content: 'image? text*',
  isolating: true,
  selectable: true,
  attrs: {
    src: { default: '' },
  },
  parseDOM: [
    {
      tag: 'div.image-block-node',
      getAttrs(dom) {
        return {
          src: dom.firstElementChild?.getAttribute('src') ?? '',
        };
      },
    },
  ],
  toDOM(node) {
    let { src, alt, title, width, height } = node.attrs;
    return ['div', { class: 'image-block-node', src }, 0];
  },
};

export class ImageBlockNodeView implements NodeView {
  dom: HTMLElement;
  image: HTMLElement;
  contentDOM: HTMLElement;

  constructor(
    public node: Node,
    public view: EditorView,
    public getPos: () => number | undefined,
    public decoraction: readonly Decoration[]
  ) {
    const src = this.node.attrs['src'] || lionSrc;
    this.dom = document.createElement('div');
    this.dom.classList.add('image-block-node');
    this.dom.setAttribute('src', src);

    this.image = this.dom.appendChild(document.createElement('img'));
    this.image.setAttribute('src', src);
    this.contentDOM = document.createElement('div');

    this.contentDOM.style.height = '24px';
    this.contentDOM.textContent = 'caption here...';
    this.dom.appendChild(this.contentDOM);
  }

  update(
    node: Node,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource
  ): boolean {
    if (node.type.name != imageBlockNodeName) {
      return false;
    }
    this.node = node;

    return true;
  }

  destroy() {
    this.dom.remove();
  }
}
