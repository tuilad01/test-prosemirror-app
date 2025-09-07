import { liftListItem } from 'prosemirror-schema-list';
import { EditorView } from 'prosemirror-view';

export function handleRemoveList(view: EditorView) {
  const { state, dispatch } = view!;
  const { tr, selection, schema } = state;
  const { paragraph, list_item } = schema.nodes;

  liftListItem(list_item)(state, dispatch);
}
