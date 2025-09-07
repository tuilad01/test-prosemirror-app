import { EditorView } from "prosemirror-view";

export function insertImage(view: EditorView) {
    view?.dispatch(
      view.state.tr.replaceSelectionWith(
        view.state.schema.nodes['image'].create({
          src: 'https://www.topgear.com/sites/default/files/2024/11/Original-25901-aw609563.jpg',
          alt: 'car test',
        })
      )
    );
  }