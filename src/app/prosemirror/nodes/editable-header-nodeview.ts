import { Node, NodeSpec } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
  ViewMutationRecord,
} from 'prosemirror-view';

export const editableHeaderNodeName = 'editable_header';

const attributes = {
  content: 'content',
  data: 'data',
  class: 'class',
};

export const editableHeaderNode: NodeSpec = {
  attrs: {
    class: { default: 'header' },
    content: { default: '' },
    data: { default: null },
  },
  content: 'block*',
  group: 'block',
  atom: true,

  toDOM: (node: any) => {
    return [
      'div',
      {
        class: 'header',
        content: node.content,
        data: node.data,
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

export class EditableHeaderNodeView implements NodeView {
  dom: HTMLElement;
  node: Node;
  contentDOM?: HTMLElement | null | undefined;
  view: EditorView;
  getPos: () => number | undefined;

  mouseDownEvent() {
    if (!this.view.hasFocus()) this.view.focus();
    const pos = this.getPos();
    if (pos != null) {
      this.view.dispatch(
        this.view.state.tr.setSelection(
          Selection.near(this.view.state.doc.resolve(pos))
        )
      );
    }
  }

  keyDownEvent(event: KeyboardEvent) {
    console.log('keydown');
    if (!this.view.hasFocus()) this.view.focus();
    const pos = this.getPos();
    if (pos != null) {
      this.view.dispatch(this.view.state.tr.insertText(event.key));
    }
  }

  constructor(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined,
    decoraction: readonly Decoration[]
  ) {
    console.log('ctor run');
    this.node = node;
    this.dom = document.createElement('div');
    this.dom.textContent = node.attrs[attributes.content];

    const contentEdit = this.dom.appendChild(document.createElement('div'));
    contentEdit.className = 'header-content';

    this.contentDOM = this.dom.appendChild(contentEdit);

    this.view = view;
    this.getPos = getPos;

    //Events
    this.dom.addEventListener('mousedown', this.mouseDownEvent.bind(this));
    //this.dom.addEventListener('keydown', this.keyDownEvent.bind(this));
  }

  update(
    node: Node,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource
  ): boolean {
    if (node.type.name !== editableHeaderNodeName) {
      return false;
    }
    this.node = node;
    // console.log('node', node, 'contentDOm', this.contentDOM);
    // const pos = this.getPos();
    // console.log('pos', pos);
    //this.dom.textContent = node.attrs[attributes.content];
    //this.contentDOM!.innerHTML = `<p>${node.textContent}</p>`;

    //if (pos != null) {
    //this.view.dispatch(this.view.state.tr.insertText(event.key));
    //}
    return true;
  }

  // contentDOM?: HTMLElement | null | undefined;
  // multiType?: boolean | undefined;
  // selectNode?: (() => void) | undefined;
  // deselectNode?: (() => void) | undefined;
  // setSelection?: ((anchor: number, head: number, root: Document | ShadowRoot) => void) | undefined;
  // stopEvent?: ((event: Event) => boolean) | undefined;
  // ignoreMutation?: ((mutation: ViewMutationRecord) => boolean) | undefined;
  destroy?(): void {
    this.dom.removeEventListener('mousedown', this.mouseDownEvent);
    //this.dom.removeEventListener('keydown', this.keyDownEvent);
    this.dom.remove();
  }
}
