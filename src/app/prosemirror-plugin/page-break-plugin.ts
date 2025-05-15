import { Plugin } from 'prosemirror-state';
import { pageSchema } from '../prosemirror-schema/page-schema';
import { EditorView } from 'prosemirror-view';

// Create a custom plugin that checks for page overflow after each transaction
export const pageBreakPlugin = new Plugin({
  appendTransaction(transactions, oldState, newState) {
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
  },
});
