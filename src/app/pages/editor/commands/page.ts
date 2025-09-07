import { EditorView } from 'prosemirror-view';
import { Plugin } from "prosemirror-state";
import { headerNodeName } from '@app/prosemirror/nodes/page-header';
import { editableHeaderNodeName } from '@app/prosemirror/nodes/editable-header-nodeview';

export function getBlockDistanceFromPage(view: EditorView): number | null {
  if (!view) {
    return null;
  }

  const { state } = view;
  const { $to } = state.selection;

  const block = view.domAtPos($to.start(3))?.node as HTMLElement | undefined;

  const page = view.domAtPos($to.start(1))?.node as HTMLElement | undefined;

  if (!block || !page) {
    return null;
  }

  return block.getBoundingClientRect().top - page.getBoundingClientRect().top;
}
export function insertNewPage(view: EditorView, lastPage: number) {
  if (!view) {
    return;
  }

  const { state, dispatch } = view;
  const {schema} = state;
  const { page: pageNode } = schema.nodes;

  if (dispatch) {
    const nextLastPage = lastPage + 1;
    const newPage = pageNode.create({ 'page-number': nextLastPage }, [
      schema.nodes['paragraph'].create(),
    ])!;
    const position = state.doc.content.size;
    const tr = state.tr.insert(position, newPage).scrollIntoView();
    dispatch(tr);
  }

  return true;
}
 
export function  handleInsertHeader(view: EditorView) {
    if (!view) {
      return;
    }
    const { state, dispatch } = view;
    const { tr, selection } = state;
    const headerNodeType = state.schema.nodes[headerNodeName];
    const headerNode = headerNodeType.create(null, [
      state.schema.nodes['paragraph'].create(null, state.schema.text('123')),
    ]);

    //console.log(selection.$from.after());

    dispatch(tr.insert(selection.from, headerNode));
  }
  export function handleInsertEditableHeader(view: EditorView) {
    if (!view) {
      return;
    }
    const { state, dispatch } = view;
    const { tr, selection } = state;
    const editableHeaderNodeType = state.schema.nodes[editableHeaderNodeName];
    const editableHeaderNode = editableHeaderNodeType.create(
      {
        content: 'truong tan dat [variable1]',
        data: [{ variable1: '123' }],
      },
      [state.schema.nodes['paragraph'].create(null, state.schema.text('123'))]
    );

    //console.log(selection.$from.after());

    dispatch(tr.insert(selection.$from.after(), editableHeaderNode));
  }