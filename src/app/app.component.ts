import { AfterViewInit, Component } from '@angular/core';
import {
  EditorState,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, NodeSpec } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageNodeSpec } from './prosemirror-nodes/page';
import { pageBreakPlugin } from './prosemirror-plugin/page-break-plugin';
import { pageSchema } from './prosemirror-schema/page-schema';
import { Node } from 'prosemirror-model';
import {
  pageBreakPlugin2,
  repaginate,
  repaginate2,
} from './prosemirror-plugin/page-break-plugin2';
import {
  canJoin,
  MapResult,
  ReplaceStep,
  StepMap,
} from 'prosemirror-transform';

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

  console.log(detail);
  return detail;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
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
  constructor() {}
  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  ngAfterViewInit(): void {
    const doc = Node.fromJSON(this.mySchema, {
      type: 'doc',
      content: [
        {
          type: 'page',
          attrs: { 'page-number': '1' },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. blandit lorem in auctor egestas. In vehicula, lorem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Maecenas risus nisl, aliquet id mi eu, iaculis mattis ante. Aliquam nec tincidunt felis, vitae venenatis ligula. Integer eleifend, justo ac mattis sagittis, tortor lorem ornare nibh, at tempor enim nisi vitae diam. Praesent venenatis commodo orci a tristique. Nulla ex nibh, laoreet ut quam quis, rhoncus faucibus magna.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam blandit arcu ut odio iaculis, eu facilisis massa varius. Praesent dolor nibh, laoreet ac nisi id, placerat gravida justo. Quisque ac felis dictum nulla ornare posuere. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque pretium lacinia justo quis hendrerit. Phasellus tortor risus, dapibus sed nunc ut, lacinia lobortis turpis. Praesent porttitor leo at libero dapibus auctor. Sed ac molestie tellus. Etiam ultrices magna quis pulvinar blandit. Phasellus bibendum consequat tincidunt. Quisque sed sem sed lacus volutpat placerat. Sed nisi lacus, aliquet ac lobortis ut, iaculis quis ipsum. Nam sagittis tortor sit amet scelerisque vulputate. Aenean mollis et enim at ultricies. Etiam ac sollicitudin elit, eget sollicitudin ligula. Integer id urna vehicula, cursus mauris sit amet, tristique lacus. Nunc faucibus ex nec enim dapibus vehicula. Nunc at leo laoreet, pharetra lacus ut, ultricies urna. Cras vitae finibus tellus. Praesent quis nunc id purus gravida tempor. Fusce ac felis venenatis, luctus arcu elementum, tempor neque. Nullam ut erat id purus tincidunt dictum. Curabitur imperdiet vel augue nec ornare. In hac habitasse platea dictumst. Proin pulvinar augue sapien, eget porttitor tellus pharetra ac. Nam sit amet nunc et lectus sodales dictum non ut leo. Maecenas vestibulum justo nec lacinia rutrum. Maecenas in fermentum lectus, sed aliquam ipsum. Aliquam interdum sollicitudin mi, vel placerat magna commodo et. Nunc sit amet est mauris. Nam accumsan ullamcorper tortor et mollis. Nunc accumsan est nec varius pulvinar. Vivamus feugiat volutpat tortor non volutpat. Mauris et felis in justo porttitor maximus faucibus sed enim. Etiam imperdiet sed turpis et vulputate. Morbi posuere ex nec dui vulputate, sed consequat felis venenatis. Duis consectetur sodales arcu. Pellentesque laoreet malesuada nunc nec rutrum. Suspendisse tincidunt sed nunc vitae varius. Ut pellentesque ipsum ac pulvinar porttitor. Duis et elit a odio auctor venenatis. Curabitur sit amet leo et magna fermentum accumsan. Pellentesque interdum hendrerit ex et vulputate. Suspendisse condimentum aliquet mi at placerat. Aliquam dapibus magna ut urna euismod, congue condimentum nibh scelerisque. Nam iaculis lobortis nisi, nec facilisis lorem rhoncus nec. Aenean blandit lorem in auctor egestas. In vehicula, lorem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Maecenas risus nisl, aliquet id mi eu, iaculis mattis ante. Aliquam nec tincidun',
                  //text: '',
                },
              ],
            },
          ],
        },
        // {
        //   type: 'page',
        //   attrs: { 'page-number': '2' },
        //   content: [
        //     {
        //       type: 'paragraph',
        //       content: [{ type: 'text', text: 'page 2' }],
        //     },
        //   ],
        // },
      ],
    });
    this.view = new EditorView(document.querySelector('#editor'), {
      state: EditorState.create({
        schema: this.mySchema,
        doc: doc,
        // doc: DOMParser.fromSchema(this.mySchema).parse(
        //   document.querySelector('#content') as Node
        // ),
        plugins: [
          ...exampleSetup({ schema: this.mySchema }),
          pageBreakPlugin2(this.view),
        ],
      }),
      dispatchTransaction: (tr: Transaction) => {
        const view = this.view!,
          { state } = view,
          newTransaction = state.tr;
        const originPosition = tr.selection.to;

        if (tr.docChanged) {
          const transactionType = getTransactionType(tr);
          if (
            transactionType.type == 'DELETE' &&
            tr.selection.$from.parentOffset === 0
          ) {
            const currentPosition = tr.selection.$from.before();
            console.log(
              'delete and parentosset = 0',
              ' start inside position = ',
              currentPosition
            );
            if (canJoin(tr.doc, currentPosition)) {
              tr.join(currentPosition);
            }
          }

          const transaction = repaginate2(tr);
          if (transaction) {
            console.log(
              'cursor move from ',
              originPosition,
              ' to ',
              transaction.mapping.map(originPosition)
            );

            let newCursorPosition = originPosition;
            if (transactionType.type === 'INSERT') {
              newCursorPosition += transactionType.insertText!.length;
            }
            let selectionTransaction: Transaction | undefined;

            // if (newCursorPosition < transaction.doc.nodeSize) {
            //   const textSelection = TextSelection.create(
            //     transaction.doc,
            //     newCursorPosition
            //   );
            //   selectionTransaction = transaction.setSelection(textSelection);
            // }

            const newSelection = Selection.findFrom(
              transaction.doc.resolve(originPosition),
              1,
              true
            );
            if (newSelection) {
              selectionTransaction = transaction.setSelection(newSelection);
            }

            // TODO: update selection text (cursor)
            view.updateState(
              view.state.apply(
                selectionTransaction ? selectionTransaction : transaction
              )
            );
            return;
          }
        } else {
          // console.log(
          //   'cursor move from ',
          //   originPosition,
          //   ' to ',
          //   tr.mapping.map(originPosition)
          // );
        }
        const detail = getTransactionDetail(tr);

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

    // document.addEventListener('click', (event) => {
    //   console.log(event.target);

    //   console.log(
    //     'posAtDOM: ',
    //     this.view?.posAtDOM(event.target as any, 0, -1)
    //   );
    // });
  }

  insertNewPage() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
    const { page: pageNode } = this.mySchema.nodes;

    // const { $from } = state.selection;
    // const index = $from.index();

    // if (!$from.parent.canReplaceWith(index, index, pageNode)) return false;

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
}
