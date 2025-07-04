import { headerNodeName } from '@app/prosemirror-nodes/page-header';
import { PluginKey, Plugin, EditorState, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const decorationPluginKey = new PluginKey('decorationPlugin');

export const decorationPlugin = new Plugin({
  key: decorationPluginKey,
  props: {
    decorations(state) {
      const decorations = this.getState(state);
      return decorations;
    },
  },
  state: {
    init(config, instance) {
      return DecorationSet.empty;
    },
    apply: (tr, oldSet: DecorationSet, oldState, newState) => {
      const newSet = convertHeaderToDecoration(tr, newState);
      return newSet;
    },
  },
});

function convertHeaderToDecoration(
  tr: Transaction,
  newState: EditorState
): DecorationSet {
  const doc = newState.doc;
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === headerNodeName) {
    }
    return false;
  });
  return DecorationSet.create(doc, decorations);
}
