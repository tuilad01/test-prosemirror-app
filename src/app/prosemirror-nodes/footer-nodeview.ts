import { Node } from 'prosemirror-model';
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
  ViewMutationRecord,
} from 'prosemirror-view';

export class FooterNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM?: HTMLElement | null | undefined;
  node: Node;
  view: EditorView;
  getPos: () => number | undefined;
  decorations: readonly Decoration[];

  constructor(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined,
    decorations: readonly Decoration[]
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.decorations = decorations;
    this.dom = document.createElement('div');
    this.dom.className = 'dom-element';
    this.dom.contentEditable = 'false';
    this.contentDOM = this.dom.appendChild(document.createElement('div'));
    this.contentDOM.className = 'contentDOM-element';
  }

  update(
    node: Node,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource
  ): boolean {
    console.log('update run');
    if (node.type.name != 'pageFooter') return false;
    return true;
  }

  destroy() {
    this.dom.remove();
    this.contentDOM?.remove();
  }
}
