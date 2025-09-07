import { toggleMark } from 'prosemirror-commands';
import { Mark, Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
export function findAllMarks(from: number, to: number, doc: Node) {
  const marks: (Mark | null)[] = [];
  doc.nodesBetween(from, to, (node, pos) => {
    if (node.isInline) {
      if (node.marks.length > 0) {
        marks.push(...node.marks);
      } else {
        marks.push(null);
      }
    }
  });
  return marks;
}
export function getMarkFontSize(markFontSize: Mark): number {
  return +markFontSize.attrs['fontSize'].replace('px', '');
}

export function handleEnterFontFamily(view: EditorView, event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const { value } = event.currentTarget as any;

    if (!view) {
      return;
    }

    const state = view.state;
    let tr = state.tr;
    const { from, to } = state.selection;
    const fontFamilyMark = state.schema.marks['fontFamily'];

    if (state.doc.rangeHasMark(from, to, fontFamilyMark)) {
      tr.removeMark(from, to, fontFamilyMark);
    }

    tr.addMark(from, to, fontFamilyMark.create({ fontFamily: value }));

    view.dispatch(tr);
  }
}

export function handleEnter(view: EditorView, event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const { value } = event.currentTarget as any;

    if (!view) {
      return;
    }

    const state = view.state;
    let tr = state.tr;
    const { from, to } = state.selection;
    const fontSizeMark = state.schema.marks['fontSize'];

    if (state.doc.rangeHasMark(from, to, fontSizeMark)) {
      tr.removeMark(from, to, fontSizeMark);
    }
    if (value !== '16') {
      tr.addMark(from, to, fontSizeMark.create({ fontSize: value + 'px' }));
    }

    view.dispatch(tr);
  }
}
export function handleToggleFontSize(view: EditorView, fontSize: number = 40) {
  toggleMark(view!.state.schema.marks['fontSize'], {
    fontSize: '40px',
  })(view!.state, view!.dispatch);
}
export function toggleMarkCommand(view: EditorView, markTypeName: string, attrs?: any) {
  if (!view) {
    return;
  }
  const state = view.state;
  let tr = state.tr;
  const marks = state.selection.$from.marks();
  let newFontSize = '18px';
  const existingFontSizeMark = marks.find(
    (mark) => mark.type.name === 'fontSize'
  );

  const hasFontSizeMark = state.doc.rangeHasMark(
    state.selection.from,
    state.selection.to,
    state.schema.marks['fontSize']
  );

  if (hasFontSizeMark) {
    console.log('has fontSize mark');
  }
  if (existingFontSizeMark) {
    newFontSize =
      +existingFontSizeMark.attrs['fontSize'].replace('px', '') + 2 + 'px';
    tr.removeMark(
      state.selection.from,
      state.selection.to,
      state.schema.marks['fontSize']
    );
  }

  const newFontSizeMark = state.schema.marks['fontSize'].create({
    fontSize: newFontSize,
  });

  tr.addMark(state.selection.from, state.selection.to, newFontSizeMark);
  //tr.setSelection(state.selection);
  // const newSelection = new TextSelection(tr.doc.resolve(state.selection.to));

  // tr.setSelection(newSelection);
  view.dispatch(tr);
}
export function increaseFontSize(view: EditorView) {
  toggleMarkCommand(view, 'fontSize');
}
