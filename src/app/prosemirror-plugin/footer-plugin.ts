import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';

const footerPluginKey = new PluginKey('footerPlugin');

function footerDecoration(state: EditorState) {
  const decorations: Decoration[] = [];
  state.doc.descendants((node: Node, pos: number) => {
    if (node.isBlock) {
      const footerDeco = Decoration.widget(pos + node.nodeSize - 1, (view) => {
        const footer = document.createElement('div');
        footer.className = 'footer';
        footer.textContent = 'Footer';
        footer.addEventListener('dblclick', () => {
          let tr = view.state.tr;
          tr.insert(
            0,
            state.schema.nodes['paragraph'].create(
              null,
              state.schema.text('some thing')
            )
          );
          view.dispatch(tr);
        });

        return footer;
      });

      decorations.push(footerDeco);
    }

    return false;
  });

  return DecorationSet.create(state.doc, decorations);
}

export const footerPlugin = new Plugin({
  key: footerPluginKey,
  //   view(_) {
  //     return {
  //       update(view, prevState) {
  //         console.log('update plugin run');

  //         console.log('node', view.state.selection.$from.parent);
  //       },
  //       destroy() {},
  //     };
  //   },
  //   state: {
  //     init: (config, { doc }) => {
  //       return DecorationSet.empty;
  //     },
  //     apply: (tr, oldSet, oldState, newState) => {
  //       // Map the old decorations forward through the transaction
  //       let newSet = oldSet.map(tr.mapping, tr.doc);

  //       // Check for custom metadata in the transaction to add/remove widgets
  //       const widgetMeta = tr.getMeta(footerPluginKey);
  //       if (widgetMeta) {
  //         if (widgetMeta.action === 'add') {
  //           const { pos, domNode } = widgetMeta;
  //           const widget = Decoration.widget(pos, domNode, {
  //             // Optional: specify side for rendering relative to text
  //             // `side: -1` renders before text, `side: 1` renders after
  //             side: 0,
  //             // Optional: provide a key for updating the widget without re-creating
  //             // this can be useful for React/Vue components
  //             key: `my-widget-${pos}`,
  //           });
  //           newSet = newSet.add(tr.doc, [widget]);
  //         } else if (widgetMeta.action === 'remove') {
  //           // You might have a way to identify which widget to remove
  //           // For simplicity, let's say we remove all widgets for now
  //           newSet = DecorationSet.empty;
  //         }
  //       }

  //       return newSet;
  //     },
  //   },
  props: {
    decorations(state) {
      return footerDecoration(state);
    },
  },
});
