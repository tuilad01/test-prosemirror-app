import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { pageSchema } from '../schema/page-schema';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';
import { nodes } from 'prosemirror-schema-basic';
const breakPageByText = (text: string) => {
  return function (
    transactions: readonly Transaction[],
    oldState: EditorState,
    newState: EditorState
  ) {
    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index];
      if (!transaction.docChanged) {
        return;
      }
      if (transaction.doc.textContent.includes('break page')) {
        const newPage = pageSchema.nodes['page'].create({ 'page-number': 2 }, [
          pageSchema.nodes['paragraph'].create(),
        ]);
        const position = newState.doc.content.size;
        let trWithPage = newState.tr
          // delete break page
          .delete(
            transaction.selection.$from.pos - 'break page'.length,
            transaction.selection.$from.pos
          )
          // add new page
          .insert(position - 'break page'.length, newPage);
        console.log(trWithPage);
        // Return the updated transaction (apply this change)
        return trWithPage;
      } else {
        console.log('no break');
      }
    }
    return null;
  };
};

const breakPageBySize = (view: EditorView | undefined) => {
  return function (
    transactions: readonly Transaction[],
    oldState: EditorState,
    newState: EditorState
  ) {
    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index];
      if (!transaction.docChanged) {
        return;
      }

      let currentPage = null;
      newState.doc.descendants((node, pos) => {
        if (node.type.name === 'page') {
          // Detect the position of the page node that has been modified
          // (Check if the current node was affected by the transaction)
          if (transaction.mapping.map(pos) !== pos) {
            // This page node was modified in the transaction
            currentPage = pos;
            return; // Break the iteration
          }
        }
      });

      console.log('currentPage', currentPage);
      if (!view) {
        return null;
      }
      const $from = transaction.selection.$from;
      const node = view.nodeDOM($from.depth);
      // if (transaction.doc.textContent.includes('break page')) {
      //   const newPage = pageSchema.nodes['page'].create({ 'page-number': 2 }, [
      //     pageSchema.nodes['paragraph'].create(),
      //   ]);
      //   const position = newState.doc.content.size;
      //   let trWithPage = newState.tr
      //     // delete break page
      //     .delete(
      //       transaction.selection.$from.pos - 'break page'.length,
      //       transaction.selection.$from.pos
      //     )
      //     // add new page
      //     .insert(position - 'break page'.length, newPage);
      //   console.log(trWithPage);
      //   // Return the updated transaction (apply this change)
      //   return trWithPage;
      // } else {
      //   console.log('no break');
      // }
    }
    return null;
  };
};
// Create a custom plugin that checks for page overflow after each transaction
export function pageBreakPlugin(view: EditorView | undefined) {
  let editorView: EditorView;

  return new Plugin({
    view(view) {
      editorView = view;
      return {};
    },
    //appendTransaction: breakPageByText('break page'),
    appendTransaction(
      transactions: readonly Transaction[],
      oldState: EditorState,
      newState: EditorState
    ) {
      for (let index = 0; index < transactions.length; index++) {
        const transaction = transactions[index];
        if (!transaction.docChanged) {
          return;
        }

        let pagePosition = 0;
        // for testing
        // console.log('parent', transaction.selection.$from.parent);
        // console.log('parentOffset', transaction.selection.$from.parentOffset);
        // console.log('pos', transaction.selection.$from.pos);

        // console.log(
        //   'dom by  pos - parentOffset',
        //   editorView.nodeDOM(
        //     transaction.selection.$from.pos -
        //       transaction.selection.$from.parentOffset -
        //       1
        //   )
        // );

        const parentNode = transaction.selection.$from.parent;
        let newParentNodePosition = 0;

        let currentPage: Node | undefined;
        let currentPagePosition = 0;

        let nextPageNumber = 0;
        let nextPage: Node | undefined;
        let nextPagePosition = 0;
        newState.doc.descendants((node, pos) => {
          // Getting current parent position
          if (node.eq(parentNode)) {
            newParentNodePosition = newState.tr.mapping.map(pos);

            newState.doc.descendants((pageNode, pagePosition) => {
              // Finding current page
              if (
                !currentPage &&
                pageNode.type.name === 'page' &&
                pagePosition < newParentNodePosition &&
                pagePosition + pageNode.nodeSize > newParentNodePosition
              ) {
                currentPage = pageNode;
                currentPagePosition = pagePosition;
                const currentPageNumber = parseInt(
                  currentPage.attrs['page-number'],
                  10
                );
                nextPageNumber = currentPageNumber + 1;
              }
              // Finding next page
              if (
                !nextPage &&
                currentPage &&
                nextPageNumber &&
                pageNode.attrs['page-number'] === nextPageNumber.toString()
              ) {
                nextPage = pageNode;
                nextPagePosition = pagePosition;
              }
            });
          }
        });

        console.log(
          'newParentNodePosition',
          newParentNodePosition,
          'currentPage',
          currentPage,
          'currentPagePosition',
          currentPagePosition,
          'nextPage',
          nextPage,
          'nextPagePosition',
          nextPagePosition
        );

        if (!currentPage) {
          console.error('ERROR. Not found current page.');
          return;
        }

        const currentPageDOM = editorView.dom.querySelector(
          `div[page-number='${currentPage.attrs['page-number']}']`
        ) as any;

        if (!currentPageDOM) {
          console.error('ERROR. Not found current page DOM.');
          return;
        }

        const { scrollHeight, clientHeight } = currentPageDOM;
        // the page is overflowed then we need to break the current page
        if (scrollHeight > clientHeight) {
          let nextPageTransaction = newState.tr;
          if (nextPagePosition > 0) {
            // Next page is existed so we just move the current block to the new page
            const blockPosition = transaction.selection.$from;
            const block = blockPosition.parent.toJSON();
            return newState.tr
              .insert(
                nextPagePosition + 1,
                Node.fromJSON(newState.schema, block)
              )
              .delete(
                blockPosition.pos - blockPosition.parentOffset - 1,
                blockPosition.pos
              );
          } else {
            // Because next page is not existed, we need to create a new page and move the current block
            const blockPosition = transaction.selection.$from;
            const block = blockPosition.parent.toJSON();
            const newPage = pageSchema.nodes['page'].create(
              { 'page-number': nextPageNumber },
              [Node.fromJSON(newState.schema, block)]
            );
            nextPageTransaction = newState.tr
              .insert(newState.doc.content.size, newPage)
              .delete(
                blockPosition.pos - blockPosition.parentOffset - 1,
                blockPosition.pos
              );

            return nextPageTransaction;
          }
        }
        // having next page
        if (nextPagePosition > 0) {
          // MOVING BLOCK
          // const blockPosition = transaction.selection.$from;
          // const block = blockPosition.parent.toJSON();
          // return newState.tr
          //   .insert(nextPagePosition + 1, Node.fromJSON(newState.schema, block))
          //   .delete(
          //     blockPosition.pos - blockPosition.parentOffset - 1,
          //     blockPosition.pos
          //   );
        } else {
          // add new page.
        }

        //console.log('transaction.doc.textContent', transaction.doc.node.textContent);
        //console.log('page 2', newState.tr.doc.children[1].resolve(newState.));
        //console.log('doc', newState.doc.resolve)
        //newState.doc.children[2].
        // console.log('doc.child(1)', newState.doc.child(1));
        // console.log('doc.nodeAt(1)', newState.doc.nodeAt(1));
        // // console.log(
        // //   'doc.nodeAt($form.pos)',
        // //   newState.doc.nodeAt(transaction.selection.$from)
        // // );
        // console.log('nodeSize', newState.doc.nodeSize);
        // console.log('content.size', newState.doc.content.size);
        // if (newState.doc.textContent.includes('insert')) {
        //   return newState.tr.insert(
        //     newState.doc.content.size - 3,
        //     newState.schema.nodes['paragraph'].create(null, [
        //       newState.schema.text('datrtruong'),
        //     ])
        //   );
        // }

        // newState.doc.descendants((node, pos) => {
        //   if (node.type.name === 'paragraph') {
        //     // Detect the position of the page node that has been modified
        //     // (Check if the current node was affected by the transaction)
        //     const newPositionParagraph = transaction.mapping.map(pos);
        //     newState.doc.descendants((parentNode, parentPos) => {
        //       if (
        //         parentNode.type.name === 'page' &&
        //         newPositionParagraph >= parentPos &&
        //         newPositionParagraph <= parentPos + parentNode.nodeSize
        //       ) {
        //         currentPage = parentNode;
        //         pagePosition = parentPos;
        //         return; // Stop the search
        //       }
        //     });
        //   }
        // });
        // if (!currentPage) {
        //   return;
        // }
        // console.log('currentPage', currentPage);
        // if (!editorView) {
        //   return null;
        // }
        // const pageDOM = editorView.dom.querySelector(
        //   `div[page-number='${currentPage.attrs['page-number']}']`
        // ) as any;
        // console.log(pageDOM);

        // const scrollHeight = pageDOM.scrollHeight;
        // const clientHeight = pageDOM.clientHeight;

        // console.log('scrollHeight', scrollHeight, 'clietHeight', clientHeight);
        // if (scrollHeight > clientHeight) {
        //   console.log('page overflow');

        //   const newPage = pageSchema.nodes['page'].create(
        //     { 'page-number': 2 },
        //     [pageSchema.nodes['paragraph'].create()]
        //   );
        //   const newPositionBlock = transaction.selection.$from.pos;
        //   console.log('index', newPositionBlock);
        //   console.log(
        //     'before',
        //     transaction.selection.$from.before(newPositionBlock!)
        //   );
        //   const block = editorView.nodeDOM(
        //     transaction.selection.$from.before(newPositionBlock!)
        //   );
        //   console.log('block', block);

        //   //transaction.doc.resolve(transaction.selection.$from.parent)

        //   //let newTransaction= newState.tr.insert(newState.doc.content.size, newPage) ;
        //   // TODO: move block
        //   //newTransaction.
        //   //return newTransaction;
        // }
        // if (transaction.doc.textContent.includes('break page')) {
        //   const newPage = pageSchema.nodes['page'].create({ 'page-number': 2 }, [
        //     pageSchema.nodes['paragraph'].create(),
        //   ]);
        //   const position = newState.doc.content.size;
        //   let trWithPage = newState.tr
        //     // delete break page
        //     .delete(
        //       transaction.selection.$from.pos - 'break page'.length,
        //       transaction.selection.$from.pos
        //     )
        //     // add new page
        //     .insert(position - 'break page'.length, newPage);
        //   console.log(trWithPage);
        //   // Return the updated transaction (apply this change)
        //   return trWithPage;
        // } else {
        //   console.log('no break');
        // }
      }
      return null;
    },
  });
}
