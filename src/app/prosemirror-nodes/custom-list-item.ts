import { src as lionSrc } from '@app/data/lion';
import { NodeSpec, Node, NodeType } from 'prosemirror-model';
import {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
} from 'prosemirror-view';
import {
  Command,
  EditorState,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state';

export const className = 'custom-list-item-node';
export const customListItemNodeName = 'custom_list_item';
export const customListItemNodeSpec: NodeSpec = {
  group: 'block',
  content: 'inline*',
  defining: true,
  attrs: {
    checked: { default: false },
    class: { default: className },
  },
  parseDOM: [
    {
      tag: `div.${className}`, // Matches the outer div with the class
      // Corrected: The content div is a direct child 'div' of the matched tag
      // contentElement: 'div',
      getAttrs(dom) {
        // Find the checkbox input within the parsed DOM element
        const checkbox = dom.querySelector(
          'input[type="checkbox"]'
        ) as HTMLInputElement;

        return {
          checked: checkbox ? checkbox.checked : false, // Get the checked state directly from the input
          class: dom.className, // Re-read the class from the DOM if necessary
        };
      },
    },
  ],
  toDOM(node) {
    let { class: className, column } = node.attrs;
    return [
      'div',
      { class: className, contenteditable: 'true' },
      ['input', { type: 'checkbox' }, 0],
    ];
  },
};

export class customListItemNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  input: HTMLInputElement;
  //beforeInputDom: HTMLDivElement;

  constructor(
    public node: Node,
    public view: EditorView,
    public getPos: () => number | undefined,
    public decoraction: readonly Decoration[]
  ) {
    const className = node.attrs['class'];
    this.dom = document.createElement('div');
    this.dom.contentEditable = 'true';
    this.dom.classList.add(className);

    this.input = this.dom.appendChild(document.createElement('input'));
    this.input.type = 'checkbox';
    this.input.contentEditable = 'false';
    this.input.addEventListener('change', this.handleChange.bind(this));
    // this.beforeInputDom = this.dom.appendChild(document.createElement('div'));
    // this.beforeInputDom.textContent = '123';
    // this.beforeInputDom.contentEditable = 'true';

    this.contentDOM = this.dom.appendChild(document.createElement('div'));
    // this.contentDOM.contentEditable = 'true';
    //this.contentDOM = this.dom;
  }

  stopEvent(event: Event): boolean {
    // If the event target is the checkbox, stop ProseMirror from handling it.
    console.log(event.target);
    if (event.target === this.dom) {
      return true; // ProseMirror should ignore this event
    }
    // If the event target is the static 'beforeInputDom' or its children.
    // if (this.beforeInputDom.contains(event.target as HTMLElement)) {
    //   return true; // ProseMirror should ignore this event
    // }
    // For other events (e.g., within contentDOM), let ProseMirror handle them.
    return false;
  }

  update(
    node: Node,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource
  ): boolean {
    if (node.type.name != customListItemNodeName) {
      return false;
    }

    console.log('update');

    this.node = node;

    return true;
  }

  destroy() {
    this.input.removeEventListener('change', this.handleChange.bind(this));
    if (
      this.dom.parentElement?.children.length === 1 &&
      this.contentDOM.textContent === ''
    ) {
      this.dom.parentElement.remove();
    } else {
      this.dom.remove();
    }
  }

  handleChange(event: Event) {
    console.log('change');
    const newCheckedState = (event.target as HTMLInputElement).checked;
    const { state, dispatch } = this.view;
    const { tr } = state;
    const from = this.getPos()!;
    const to = from + this.node.content.size;
    tr.setNodeMarkup(from, undefined, {
      ...this.node.attrs,
      checked: newCheckedState,
    });
    dispatch(tr);
  }
}

export const removeEmptyListItemAndInsertParagraph: Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean => {
  const { selection } = state;
  const { $from } = selection;

  // 1. Check if the selection is empty (a cursor)
  if (!selection.empty) {
    return false;
  }

  // 2. Check if the cursor is directly inside a custom_list_item
  //    and if that custom_list_item is empty (no content).
  const parent = $from.parent;
  if (parent.type.name !== customListItemNodeName) {
    return false;
  }

  // Check if the content is empty. `text*` means it can have text.
  // node.content.size will be 0 for an empty textblock.
  if (parent.content.size > 0) {
    return false;
  }

  // Ensure the cursor is at the very end of the empty list item.
  // This is important because if the cursor is at the beginning,
  // we might want default Enter behavior (creating a new list item)
  // or a different "lift" behavior.
  if ($from.parentOffset !== parent.content.size) {
    return false;
  }

  if (dispatch) {
    let tr = state.tr;
    const pos = $from.before(); // Position before the empty list item node

    // Get the paragraph node type from the schema
    const paragraphType: NodeType | undefined = state.schema.nodes['paragraph'];

    if (!paragraphType) {
      console.warn(
        'Paragraph node type not found in schema. Cannot insert paragraph.'
      );
      return false; // Schema must have a 'paragraph' node
    }

    // Delete the empty custom_list_item node
    tr = tr.deleteRange(pos, pos + parent.nodeSize - 1);

    // Insert a new paragraph node at the same position
    // We get the position after the deletion using map.
    const mappedPos = tr.mapping.map(pos);
    const newParagraph = paragraphType.createAndFill(); // createAndFill creates an empty paragraph
    tr = tr.insert(mappedPos, newParagraph!); // Use ! as createAndFill could return null if schema prevents it

    // Place the selection inside the newly inserted paragraph
    // The selection should be at the start of the new paragraph.
    // The position is mappedPos + 1 (inside the paragraph).
    const newSelectionPos = tr.doc.resolve(mappedPos + 2);
    // //tr = tr.setSelection(new TextSelection(newSelectionPos)); // Simplified way to set selection inside the new paragraph
    tr = tr.setSelection(TextSelection.create(tr.doc, newSelectionPos.pos));

    dispatch(tr.scrollIntoView()); // Scroll into view after dispatching
  }

  return true; // Command handled
};

export const handleArrowLeftChecklistCommand: Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean => {
  const { selection } = state;
  const { $from } = selection;

  // 1. Check if the selection is empty (a cursor)
  if (!selection.empty) {
    return false;
  }

  // 2. Check if the cursor is directly inside a custom_list_item
  //    and if that custom_list_item is empty (no content).
  const parent = $from.parent;
  if (parent.type.name !== customListItemNodeName) {
    return false;
  }

  // Check if the content is empty. `text*` means it can have text.
  // node.content.size will be 0 for an empty textblock.
  // if (parent.content.size > 0) {
  //   return false;
  // }

  // Ensure the cursor is at the very end of the empty list item.
  // This is important because if the cursor is at the beginning,
  // we might want default Enter behavior (creating a new list item)
  // or a different "lift" behavior.
  if ($from.parentOffset > 0) {
    return false;
  }

  const previousNode = $from
    .node($from.depth - 1)
    .child($from.index($from.depth - 1) - 1);
  if (!previousNode || previousNode.type.name !== customListItemNodeName) {
    return false;
  }

  if (dispatch) {
    let tr = state.tr;
    const pos = $from.before(); // Position before the empty list item node

    // // Get the paragraph node type from the schema
    // const paragraphType: NodeType | undefined = state.schema.nodes['paragraph'];

    // if (!paragraphType) {
    //   console.warn(
    //     'Paragraph node type not found in schema. Cannot insert paragraph.'
    //   );
    //   return false; // Schema must have a 'paragraph' node
    // }

    // // Delete the empty custom_list_item node
    // tr = tr.deleteRange(pos, pos + parent.nodeSize - 1);

    // // Insert a new paragraph node at the same position
    // // We get the position after the deletion using map.
    // const mappedPos = tr.mapping.map(pos);
    // const newParagraph = paragraphType.createAndFill(); // createAndFill creates an empty paragraph
    // tr = tr.insert(mappedPos, newParagraph!); // Use ! as createAndFill could return null if schema prevents it

    // // Place the selection inside the newly inserted paragraph
    // // The selection should be at the start of the new paragraph.
    // // The position is mappedPos + 1 (inside the paragraph).
    const newSelectionPos = tr.doc.resolve(pos - 1);
    // //tr = tr.setSelection(new TextSelection(newSelectionPos)); // Simplified way to set selection inside the new paragraph
    tr = tr.setSelection(TextSelection.create(tr.doc, newSelectionPos.pos));

    dispatch(tr.scrollIntoView()); // Scroll into view after dispatching
  }

  return true; // Command handled
};
