import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  model,
  ModelSignal,
  OnDestroy,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Mark } from 'prosemirror-model';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageSchema } from '@app/prosemirror-schema/page-schema';
import { Node } from 'prosemirror-model';
import { selectionPlugin } from '@app/prosemirror-plugin/selection-plugin';
import { Router } from '@angular/router';
import { editableHeaderNodeName } from '@app/prosemirror-nodes/editable-header-nodeview';
import { headerNodeName } from '@app/prosemirror-nodes/page-header';
import { decorationPlugin } from '@app/prosemirror-plugin/decoration-plugin';
import {
  imageBlockNodeName,
  ImageBlockNodeView,
} from '@app/prosemirror-nodes/image-block';
import { customListNodeName } from '@app/prosemirror-nodes/custom-list';
import {
  customListItemNodeName,
  customListItemNodeView,
} from '@app/prosemirror-nodes/custom-list-item';
import { keymap } from 'prosemirror-keymap';
import {
  columnResizing,
  fixTables,
  goToNextCell,
  tableEditing,
} from 'prosemirror-tables';
import { distributeSelectedColumnsWidth, insertTable } from './commands/table';
import { lift, toggleMark } from 'prosemirror-commands';
import { liftListItem } from 'prosemirror-schema-list';

@Component({
  selector: 'app-editor',
  imports: [FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EditorComponent implements OnDestroy {
  handleRemoveList() {
    const { state, dispatch } = this.view!;
    const { tr, selection, schema } = state;
    const { paragraph, list_item } = schema.nodes;

    liftListItem(list_item)(state, dispatch);
  }

  handleToggleFontSize(fontSize: number = 40) {
    toggleMark(this.view!.state.schema.marks['fontSize'], {
      fontSize: '40px',
    })(this.view!.state, this.view!.dispatch);
  }
  handleDistributeCells() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
    const { tr, selection, schema } = state;

    distributeSelectedColumnsWidth(state, this.view, dispatch);
  }
  handleInsertTable() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
    const { tr, selection, schema } = state;
    insertTable(2, 3)(state, dispatch);
  }
  handleInsertHeader() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
    const { tr, selection } = state;
    const headerNodeType = state.schema.nodes[headerNodeName];
    const headerNode = headerNodeType.create(null, [
      state.schema.nodes['paragraph'].create(null, state.schema.text('123')),
    ]);

    //console.log(selection.$from.after());

    dispatch(tr.insert(selection.from, headerNode));
  }
  handleInsertEditableHeader() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
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
  insertImage() {
    this.view?.dispatch(
      this.view.state.tr.replaceSelectionWith(
        this.view.state.schema.nodes['image'].create({
          src: 'https://www.topgear.com/sites/default/files/2024/11/Original-25901-aw609563.jpg',
          alt: 'car test',
        })
      )
    );
  }
  private router = inject(Router);

  editorDom = viewChild<ElementRef<HTMLDivElement>>('editor');

  navigate() {
    const url = this.router.routerState.snapshot.url.includes('create')
      ? 'editor/123'
      : 'editor/create';
    //this.router.navigate([url], { onSameUrlNavigation: 'reload',  });
    window.location.replace('/#/' + url);
  }
  index = 0;
  keepFocus() {
    this.view?.focus();
  }
  textFontFamilyInput = model<string | undefined>();
  textFontSizeInput: ModelSignal<number | undefined> = model<
    number | undefined
  >();
  fontSize = 20;

  handleEnterFontFamily(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const { value } = event.currentTarget as any;

      if (!this.view) {
        return;
      }

      const view = this.view;
      const state = this.view.state;
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

  handleEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const { value } = event.currentTarget as any;

      if (!this.view) {
        return;
      }

      const view = this.view;
      const state = this.view.state;
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

  toggleMarkCommand(markTypeName: string, attrs?: any) {
    if (!this.view) {
      return;
    }
    const view = this.view;
    const state = this.view.state;
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
  increaseFontSize() {
    this.toggleMarkCommand('fontSize');
  }
  findNextBlock() {}
  exportJSon() {
    console.log(this.view?.state.doc.toJSON());
  }
  mySchema = pageSchema;
  view?: EditorView;
  pageNumber: number = 1;
  /**
   *
   */
  constructor() {
    effect(() => {
      const textFontSizeInput = this.textFontSizeInput();
      //console.log(textFontSizeInput);
    });

    afterNextRender(() => {
      //console.log('afterNextRender', this.editorDom()?.nativeElement.innerHTML);
    });
  }
  ngOnDestroy(): void {
    this.view?.destroy();
  }
  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  ngAfterViewInit(): void {
    this.initEditor();
  }
  initEditor() {
    const doc = Node.fromJSON(this.mySchema, {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            },
          ],
        },
        {
          type: imageBlockNodeName,
        },
        {
          type: imageBlockNodeName,
        },
        {
          type: imageBlockNodeName,
        },
        {
          type: customListNodeName,
          attrs: { column: 3 },
          content: [{ type: customListItemNodeName }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'orem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Ma',
            },
          ],
        },
      ],
    });

    const findNextBlock = (transaction: Transaction) => {
      const nodeAfter = Selection.findFrom(
        transaction.doc.resolve(transaction.selection.$from.after() + 1),
        1,
        false
      );
      if (nodeAfter) {
        // console.log('next block', nodeAfter);
        return;
      }

      // console.log('next block not found');
    };

    const findPreviousBlock = (transaction: Transaction) => {
      const previousBlock = Selection.findFrom(
        transaction.doc.resolve(transaction.selection.$from.before() - 1),
        -1,
        false
      );
      if (previousBlock) {
        // console.log('previous block', previousBlock);
        return;
      }

      // console.log('previous block not found');
    };
    const editorDom = this.editorDom();
    console.log('editorDom', editorDom);
    if (!editorDom || !editorDom.nativeElement) {
      console.error('ERROR. Not found editor dom with id #editor.');
    }
    const editorElements = document.querySelectorAll('#editor');
    //this.view = new EditorView(editorDom!.nativeElement as HTMLElement, {
    let state = EditorState.create({
      schema: this.mySchema,
      doc: doc,
      plugins: [
        //enterPlugin,
        columnResizing(),
        tableEditing(),
        keymap({
          Tab: goToNextCell(1),
          'Shift-Tab': goToNextCell(-1),
        }),
        ...exampleSetup({ schema: this.mySchema }),
        selectionPlugin(this.view),
        //footerPlugin,
        decorationPlugin,
        //pageBreakPlugin2(this.view),
      ],
    });

    const fix = fixTables(state);
    if (fix) {
      state = state.apply(fix.setMeta('addToHistory', false));
    }
    this.view = new EditorView(editorElements[editorElements.length - 1], {
      state: state,
      nodeViews: {
        [imageBlockNodeName]: (node, view, getPos, decorations) => {
          return new ImageBlockNodeView(node, view, getPos, decorations);
        },
        [customListItemNodeName]: (node, view, getPos, decorations) => {
          return new customListItemNodeView(node, view, getPos, decorations);
        },
      },
      dispatchTransaction: (tr: Transaction) => {
        const view = this.view!,
          { state } = view,
          newTransaction = state.tr;
        const originPosition = tr.selection.to;
        const defaultFontSize = 16;

        this.index = tr.selection.from;

        // detect table
        // const parentNodeBlock = tr.selection.$from.node(3) as Node | undefined;
        // if (parentNodeBlock) {
        //   const parentDom = view.domAtPos(tr.selection.$from.start(3))
        //     ?.node as HTMLElement;
        //   const parentDomDetail = parentDom.getBoundingClientRect();
        //   console.log(parentNodeBlock?.type.name);

        //   console.log(
        //     'position at cursor with top',
        //     view.coordsAtPos(tr.selection.from)
        //   );
        //   const pageDom = view.domAtPos(tr.selection.$from.start(1))
        //     ?.node as HTMLElement;
        //   console.log('parent page dom', pageDom);

        //   console.log(
        //     'page getBoundingClientRect',
        //     pageDom.getBoundingClientRect()
        //   );
        //   console.log('page scrollHeight', pageDom.scrollHeight);

        //   console.log(
        //     'block vs page',
        //     parentDomDetail.top - pageDom.getBoundingClientRect().top
        //   );
        //   console.log('page scrollHeight', pageDom.scrollHeight);
        // }

        // detect bold

        // const { $cursor, from, to } = tr.selection as TextSelection;
        // const boldMark = state.schema.marks['strong'];
        // const boldMarks: any[] = [];
        // tr.doc.nodesBetween(from, to, (node) => {
        //   if (node.isText) {
        //     const bold = node.marks.find(
        //       (mark) => mark.type.name === boldMark.name
        //     );
        //     boldMarks.push(bold);
        //   }
        // });
        // uncomment to see bold mark
        // console.log(boldMarks);
        // console.log(
        //   'has bold',
        //   boldMarks[0] === undefined
        //     ? false
        //     : boldMarks.every((d) => d === boldMarks[0])
        // );

        // if (tr.selection.from != tr.selection.to) {
        //   // user's selecting a range
        //   // getting all fontSize mark to figure out current font size.

        //   const marks = this.findAllMarks(
        //     tr.selection.from,
        //     tr.selection.to,
        //     tr.doc
        //   );
        //   //console.log('marks', marks);
        //   //const fontSizeMarks = marks.filter(mark => mark?.type.name === 'fontSize');

        //   let selectionFontSize: number | null = null;

        //   if (marks.length > 1) {
        //     const selectionFontSizes: number[] = [];

        //     for (let index = 0; index < marks.length; index++) {
        //       const mark = marks[index];
        //       selectionFontSizes.push(
        //         mark && mark.type.name === 'fontSize'
        //           ? this.getMarkFontSize(mark)
        //           : defaultFontSize
        //       );
        //     }

        //     selectionFontSize = selectionFontSizes.every(
        //       (fontSize) => fontSize === selectionFontSizes[0]
        //     )
        //       ? selectionFontSizes[0]
        //       : null;
        //   } else {
        //     const firstMark = marks[0];
        //     if (firstMark?.type.name === 'fontSize') {
        //       selectionFontSize = firstMark
        //         ? +firstMark.attrs['fontSize'].replace('px', '')
        //         : defaultFontSize;
        //     }
        //   }

        //   this.textFontSizeInput.set(
        //     selectionFontSize !== null ? selectionFontSize : undefined
        //   );
        // } else {
        //   const fontSizeMark = tr.selection.$to
        //     .marks()
        //     .find((mark) => mark.type.name === 'fontSize');
        //   if (fontSizeMark) {
        //     this.textFontSizeInput.set(
        //       fontSizeMark
        //         ? +fontSizeMark.attrs['fontSize'].replace('px', '')
        //         : defaultFontSize
        //     );
        //   }
        // }

        //findNextBlock(tr);
        //findPreviousBlock(tr);
        // if (tr.docChanged) {
        //   const transactionType = getTransactionType(tr);
        //   if (
        //     transactionType.type == 'DELETE' &&
        //     tr.selection.$from.parentOffset === 0
        //   ) {
        //     const currentPosition = tr.selection.$from.before();
        //     console.log(
        //       'delete and parentosset = 0',
        //       ' start inside position = ',
        //       currentPosition
        //     );
        //     if (canJoin(tr.doc, currentPosition)) {
        //       tr.join(currentPosition);
        //     }
        //   }

        //   const transaction = repaginate2(tr);
        //   if (transaction) {
        //     console.log(
        //       'cursor move from ',
        //       originPosition,
        //       ' to ',
        //       transaction.mapping.map(originPosition)
        //     );

        //     let newCursorPosition = originPosition;
        //     if (transactionType.type === 'INSERT') {
        //       newCursorPosition += transactionType.insertText!.length;
        //     }
        //     let selectionTransaction: Transaction | undefined;

        //     // if (newCursorPosition < transaction.doc.nodeSize) {
        //     //   const textSelection = TextSelection.create(
        //     //     transaction.doc,
        //     //     newCursorPosition
        //     //   );
        //     //   selectionTransaction = transaction.setSelection(textSelection);
        //     // }

        //     const newSelection = Selection.findFrom(
        //       transaction.doc.resolve(originPosition),
        //       1,
        //       true
        //     );
        //     if (newSelection) {
        //       selectionTransaction = transaction.setSelection(newSelection);
        //     }

        //     // TODO: update selection text (cursor)
        //     view.updateState(
        //       view.state.apply(
        //         selectionTransaction ? selectionTransaction : transaction
        //       )
        //     );
        //     return;
        //   }
        // } else {
        //   // console.log(
        //   //   'cursor move from ',
        //   //   originPosition,
        //   //   ' to ',
        //   //   tr.mapping.map(originPosition)
        //   // );
        // }
        // const detail = getTransactionDetail(tr);

        // Changing position of transaction if it has steps (insert/delete)
        //console.log(transactionType);

        // if (transactionType.type == 'INSERT' && transactionType.insertText && transactionType.insertText.length > 10)  {
        //   let index= 0;
        //   for (index = 0; index < transactionType.insertText.length; index++) {
        //     const element = array[index];

        //   }
        //   if (index < transactionType.insertText.length <)
        // }
        view.updateState(state.apply(tr));
      },
    });
  }

  findAllMarks(from: number, to: number, doc: Node) {
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
  getMarkFontSize(markFontSize: Mark): number {
    return +markFontSize.attrs['fontSize'].replace('px', '');
  }

  insertNewPage() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
    const { page: pageNode } = this.mySchema.nodes;

    if (dispatch) {
      this.pageNumber += 1;
      const newPage = pageNode.create({ 'page-number': this.pageNumber }, [
        this.mySchema.nodes['paragraph'].create(),
      ])!;
      const position = state.doc.content.size;
      const tr = state.tr.insert(position, newPage).scrollIntoView();
      dispatch(tr);
    }

    return true;
  }

  getBlockDistanceFromPage(view: EditorView): number | null {
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
}
