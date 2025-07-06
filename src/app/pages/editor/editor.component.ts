import {
  afterNextRender,
  afterRender,
  AfterViewInit,
  ChangeDetectionStrategy,
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
import {
  EditorState,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, NodeSpec, Mark } from 'prosemirror-model';
import { marks, schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageBreakPlugin } from '@app/prosemirror-plugin/page-break-plugin';
import { createPage, pageSchema } from '@app/prosemirror-schema/page-schema';
import { Node } from 'prosemirror-model';
import {
  pageBreakPlugin2,
  repaginate,
  repaginate2,
} from '@app/prosemirror-plugin/page-break-plugin2';
import {
  canJoin,
  MapResult,
  ReplaceStep,
  StepMap,
} from 'prosemirror-transform';
import { createParagraph } from '@app/prosemirror-nodes/paragraph';
import { toggleMark } from 'prosemirror-commands';
import { fontSizeMark } from '@app/prosemirror-marks/font-size-mark';
import { selectionPlugin } from '@app/prosemirror-plugin/selection-plugin';
import { Router } from '@angular/router';
import { FooterNodeView } from '@app/prosemirror-nodes/footer-nodeview';
import { ResizableImageView } from '@app/prosemirror-nodes/custom-image';
import {
  editableHeaderNodeName,
  EditableHeaderNodeView,
} from '@app/prosemirror-nodes/editable-header-nodeview';
import { footerPlugin } from '@app/prosemirror-plugin/footer-plugin';
import { headerNodeName } from '@app/prosemirror-nodes/page-header';
import { decorationPlugin } from '@app/prosemirror-plugin/decoration-plugin';
import {
  imageBlockNodeName,
  ImageBlockNodeView,
} from '@app/prosemirror-nodes/image-block';
import { customListNodeName } from '@app/prosemirror-nodes/custom-list';
import { customListItemNodeName } from '@app/prosemirror-nodes/custom-list-item';

class TransactionType {
  type: 'UNKNOWN' | 'INSERT' | 'DELETE' | 'CLICK' | 'SELECT' = 'UNKNOWN';
  insertText?: string; // This only has if type = INSERT
}

function isClickTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.steps.length === 0 &&
    transaction.selection.from === transaction.selection.to
  );
}
function isSelectTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.steps.length === 0 &&
    transaction.selection.from !== transaction.selection.to
  );
}

function isInsertTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.step.length > 0 &&
    transaction.steps[0] instanceof ReplaceStep &&
    transaction.steps[0].from === transaction.steps[0].to
  );
}
function isDeleteTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.step.length > 0 &&
    transaction.steps[0] instanceof ReplaceStep &&
    transaction.steps[0].from < transaction.steps[0].to
  );
}

function getInsertText(transaction: Transaction) {
  const step = transaction.steps[0] as ReplaceStep | undefined;
  return step?.slice.content.textBetween(0, step.slice.content.size) || '';
}

/**
 * - INSERT type could be PASTE
 * - DELETE type could be CUT
 * @param transaction
 * @returns
 */
function getTransactionType(transaction: Transaction): TransactionType {
  if (!transaction.steps) {
    return { type: 'UNKNOWN' };
  }

  if (isClickTransaction(transaction)) {
    return { type: 'CLICK' };
  }

  if (isSelectTransaction(transaction)) {
    return { type: 'SELECT' };
  }

  if (isInsertTransaction(transaction)) {
    return { type: 'INSERT', insertText: getInsertText(transaction) };
  }

  if (isDeleteTransaction(transaction)) {
    return { type: 'DELETE' };
  }

  return { type: 'UNKNOWN' };
}

interface TransactionDetail {
  page?: Node;
  pageStartOutsidePosition: number;
  pageEndOutsidePosition: number;
  pageStartInsidePosition: number;
  pageEndInsidePosition: number;
  nextPage?: Node;
  block?: Node;
  blockStartOutsidePosition: number;
  blockEndOutsidePosition: number;
  blockStartInsidePoistion: number;
  blockEndInsidePosition: number;
}

function getTransactionDetail(transaction: Transaction): TransactionDetail {
  const { selection } = transaction,
    { depth } = selection.$from;
  const pageDepth = 1;

  const page = selection.$from.node(pageDepth);
  const pageStartOutside = selection.$from.start(pageDepth); // first position at outside dom element
  const pageEndOutside = selection.$from.end(pageDepth); // last position at oside dom element
  const pageStartInside = selection.$from.before(pageDepth); // first position at inside dom element
  const pageEndInside = selection.$from.after(pageDepth); // last posistion at inside dom element

  const block = selection.$from.node(depth);
  const blockStartOutside = selection.$from.start(depth); // first position at outside dom element
  const blockEndOutside = selection.$from.end(depth); // last position at oside dom element
  const blockStartInside = selection.$from.before(depth); // first position at inside dom element
  const blockEndInside = selection.$from.after(depth); // last posistion at inside dom element

  const pageIndex = selection.$from.index(pageDepth);
  const nextPage =
    transaction.doc.children.length > pageIndex + 1
      ? transaction.doc.child(pageIndex + 1)
      : undefined;

  const detail: TransactionDetail = {
    page: page,
    pageStartOutsidePosition: pageStartOutside,
    pageEndOutsidePosition: pageEndOutside,
    pageStartInsidePosition: pageStartInside,
    pageEndInsidePosition: pageEndInside,
    nextPage: nextPage,
    block: block,
    blockStartOutsidePosition: blockStartOutside,
    blockEndOutsidePosition: blockEndOutside,
    blockStartInsidePoistion: blockStartInside,
    blockEndInsidePosition: blockEndInside,
  };

  // console.log(detail);
  return detail;
}

@Component({
  selector: 'app-editor',
  imports: [FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EditorComponent implements OnDestroy {
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

  toggleMarkCommand(markTypeName: string) {
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

    // afterRender(() => {
    //   console.log('afterRender', this.editorDom()?.nativeElement.innerHTML);
    //   // if (!this.editorDom()?.nativeElement) {
    //   //   this.initEditor();
    //   // }
    // });
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
    // const page = this.mySchema.nodes['doc'].create(null, [
    //   createPage(['dat', 'truong', 'tan'].map(createParagraph), 1),
    //   createPage(['dat2', 'truong2', 'tan2'].map(createParagraph), 2),
    // ]);

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
        // {
        //   type: editableHeaderNodeName,
        //   attrs: {
        //     content: 'Header non-editable [variable1]',
        //     data: 'variable1',
        //   },
        //   content: [
        //     {
        //       type: 'paragraph',
        //       content: [
        //         {
        //           type: 'text',
        //           text: 'Dat Truong Tan',
        //         },
        //       ],
        //     },
        //   ],
        // },
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
    // const doc = Node.fromJSON(this.mySchema, {
    //   type: 'doc',
    //   content: [
    //     {
    //       type: 'page',
    //       attrs: { 'page-number': '1' },
    //       content: [
    //         {
    //           type: 'paragraph',
    //           content: [
    //             {
    //               type: 'text',
    //               text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. blandit lorem in auctor egestas. In vehicula, lorem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Maecenas risus nisl, aliquet id mi eu, iaculis mattis ante. Aliquam nec tincidunt felis, vitae venenatis ligula. Integer eleifend, justo ac mattis sagittis, tortor lorem ornare nibh, at tempor enim nisi vitae diam. Praesent venenatis commodo orci a tristique. Nulla ex nibh, laoreet ut quam quis, rhoncus faucibus magna.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam blandit arcu ut odio iaculis, eu facilisis massa varius. Praesent dolor nibh, laoreet ac nisi id, placerat gravida justo. Quisque ac felis dictum nulla ornare posuere. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque pretium lacinia justo quis hendrerit. Phasellus tortor risus, dapibus sed nunc ut, lacinia lobortis turpis. Praesent porttitor leo at libero dapibus auctor. Sed ac molestie tellus. Etiam ultrices magna quis pulvinar blandit. Phasellus bibendum consequat tincidunt. Quisque sed sem sed lacus volutpat placerat. Sed nisi lacus, aliquet ac lobortis ut, iaculis quis ipsum. Nam sagittis tortor sit amet scelerisque vulputate. Aenean mollis et enim at ultricies. Etiam ac sollicitudin elit, eget sollicitudin ligula. Integer id urna vehicula, cursus mauris sit amet, tristique lacus. Nunc faucibus ex nec enim dapibus vehicula. Nunc at leo laoreet, pharetra lacus ut, ultricies urna. Cras vitae finibus tellus. Praesent quis nunc id purus gravida tempor. Fusce ac felis venenatis, luctus arcu elementum, tempor neque. Nullam ut erat id purus tincidunt dictum. Curabitur imperdiet vel augue nec ornare. In hac habitasse platea dictumst. Proin pulvinar augue sapien, eget porttitor tellus pharetra ac. Nam sit amet nunc et lectus sodales dictum non ut leo. Maecenas vestibulum justo nec lacinia rutrum. Maecenas in fermentum lectus, sed aliquam ipsum. Aliquam interdum sollicitudin mi, vel placerat magna commodo et. Nunc sit amet est mauris. Nam accumsan ullamcorper tortor et mollis. Nunc accumsan est nec varius pulvinar. Vivamus feugiat volutpat tortor non volutpat. Mauris et felis in justo porttitor maximus faucibus sed enim. Etiam imperdiet sed turpis et vulputate. Morbi posuere ex nec dui vulputate, sed consequat felis venenatis. Duis consectetur sodales arcu. Pellentesque laoreet malesuada nunc nec rutrum. Suspendisse tincidunt sed nunc vitae varius. Ut pellentesque ipsum ac pulvinar porttitor. Duis et elit a odio auctor venenatis. Curabitur sit amet leo et magna fermentum accumsan. Pellentesque interdum hendrerit ex et vulputate. Suspendisse condimentum aliquet mi at placerat. Aliquam dapibus magna ut urna euismod, congue condimentum nibh scelerisque. Nam iaculis lobortis nisi, nec facilisis lorem rhoncus nec. Aenean blandit lorem in auctor egestas. In vehicula, lorem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Maecenas risus nisl, aliquet id mi eu, iaculis mattis ante. Aliquam nec tincidun',
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //     // {
    //     //   type: 'page',
    //     //   attrs: { 'page-number': '2' },
    //     //   content: [
    //     //     {
    //     //       type: 'paragraph',
    //     //       content: [{ type: 'text', text: 'page 2' }],
    //     //     },
    //     //   ],
    //     // },
    //   ],
    // });

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
    this.view = new EditorView(editorElements[editorElements.length - 1], {
      state: EditorState.create({
        schema: this.mySchema,
        doc: doc,
        // doc: DOMParser.fromSchema(this.mySchema).parse(
        //   document.querySelector('#content') as Node
        // ),
        plugins: [
          ...exampleSetup({ schema: this.mySchema }),
          selectionPlugin(this.view),
          //footerPlugin,
          decorationPlugin,
          //pageBreakPlugin2(this.view),
        ],
      }),
      nodeViews: {
        // pageFooter: (node, view, getPos, decorations) =>
        //   new FooterNodeView(node, view, getPos, decorations),
        // image: (node, view, getPos, decorations) =>
        //   new ResizableImageView(node, view, getPos, decorations),
        // [editableHeaderNodeName]: (node, view, getPos, decorations) => {
        //   return new EditableHeaderNodeView(node, view, getPos, decorations);
        // },
        [imageBlockNodeName]: (node, view, getPos, decorations) => {
          return new ImageBlockNodeView(node, view, getPos, decorations);
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

    // this.view.setProps({
    //   handleTextInput(view, from, to, text) {
    //     //console.log('handleTextInput');
    //   },
    //   handleKeyDown: (view, event) => {
    //     let tr = view.state.tr;
    //     const { $to, to } = view.state.selection;
    //     //console.log('to', to);
    //     const blockToTop = this.getBlockDistanceFromPage(view);
    //     // if (event.key === 'Enter' && blockToTop && blockToTop + 18 > 75) {
    //     //   const nextPageIndex = $to.indexAfter(1) - 1;
    //     //   let nextPage =
    //     //     nextPageIndex + 1 > view.state.doc.childCount
    //     //       ? undefined
    //     //       : view.state.doc.child(nextPageIndex);

    //     //   if (!nextPage) {
    //     //     tr.insert(
    //     //       view.state.doc.content.size,
    //     //       createPage(
    //     //         [view.state.schema.nodes['paragraph'].create(null)],
    //     //         nextPageIndex + 1
    //     //       )
    //     //     );
    //     //     //const toMap = tr.mapping.map(to);
    //     //     //const newPosition = tr.doc.resolve(toMap);
    //     //     nextPage = tr.doc.child(nextPageIndex);
    //     //   }
    //     //   //const nextPage = view.state.doc.resolve(pageEnd + 1).after;
    //     //   console.log('nextPage', nextPage);
    //     //   //const contentPage = nextPage.child(1);
    //     //   //const firstBlockContentPage = contentPage.firstChild;
    //     //   // nextPage.forEach((node, offset) => {
    //     //   //   console.log('node', node, 'offset', offset);
    //     //   //   if (node.type.name === 'pageContent') {
    //     //   //     return;
    //     //   //   }
    //     //   // });
    //     //   let validCursor;
    //     //   let contentPagePos;
    //     //   tr.doc.descendants((node, pos) => {
    //     //     //console.log('node', node, 'pos', pos);
    //     //     if (node.type.name === 'pageContent') {
    //     //       contentPagePos = pos;
    //     //       validCursor = Selection.findFrom(tr.doc.resolve(pos), 1);
    //     //     }
    //     //     return node.attrs['page-number'] == nextPage.attrs['page-number'];
    //     //   });

    //     //   //console.log('validCursor', validCursor);
    //     //   if (validCursor) {
    //     //     view.dispatch(tr.setSelection(validCursor).scrollIntoView());
    //     //   }

    //     //   if (contentPagePos) {
    //     //     // tr.insert(
    //     //     //   contentPagePos + 1,
    //     //     //   view.state.schema.nodes['paragraph'].create()
    //     //     // );
    //     //     // const newSelection = TextSelection.findFrom(
    //     //     //   tr.doc.resolve(tr.mapping.map(contentPagePos)),
    //     //     //   1
    //     //     // );
    //     //     // tr.setSelection(newSelection!).scrollIntoView();
    //     //     // view.dispatch(tr);
    //     //   }
    //     // }
    //     // console.log('blockToTop', blockToTop);
    //   },
    // });
    // document.addEventListener('click', (event) => {
    //   console.log(event.target);

    //   console.log(
    //     'posAtDOM: ',
    //     this.view?.posAtDOM(event.target as any, 0, -1)
    //   );
    // });
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

    // const { $from } = state.selection;
    // const index = $from.index();

    // if (!$from.parent.canReplaceith(index, index, pageNode)) return false;

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
