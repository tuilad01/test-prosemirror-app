import { PluginKey, Plugin, Transaction, EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ReplaceStep, Step } from 'prosemirror-transform';

const documentHeightPluginKey = new PluginKey('document-height-plugin-key');


interface BlockHeight {
  type: string;
  height: number;
  index: number;
}

export function blockHeightPlugin(config?: any) {
  let editorView: EditorView | undefined;
  let blockHeights: BlockHeight[] = [];

  return new Plugin({
    view(view) {
      // 1. init
      editorView = view;      
      const { doc } = view.state;
      blockHeights = [];
      doc.forEach((node, offset, index) => {
        const block = view.domAtPos(offset + 1).node as HTMLElement;
        blockHeights.push({type: node.type.name, index: index, height: block.getBoundingClientRect().height});
      });

      return {};
    },
    key: documentHeightPluginKey,
    state: {
      init(config, instance) {        
        return blockHeights;
      },
      apply: (tr, oldSet: BlockHeight[], oldState, newState) => {
        // 2. update for each transaction
        const step = tr.steps[0];
        const action = ActionFactory.create(tr, step);
        if (action) {
          action.handle({view: editorView!, blockHeights, tr, step });
          return blockHeights;
        }

        return blockHeights;
      },
    },
  });
}


class ActionFactory {
  static create(tr: Transaction, step: Step): Action | null {
    if (!tr.docChanged) {
      return new ClickingAction();
    }
    if (step instanceof ReplaceStep) {
      const inserted = step.slice.content.size > 0;
      const deleted = step.from !== step.to;
      const pasted = tr.getMeta('paste');
      const typing = !deleted && step.slice.content.size === 1 && !pasted;

      //if (inserted && !deleted) return new InsertAction(tr, step);
      // if (!inserted && deleted) return new DeleteAction(tr, step);
      if (typing) {
        return new TypingAction();
      }
    }

    return null;
  }
}

interface TransactionContext {
  view: EditorView;
  blockHeights: BlockHeight[];
  tr: Transaction;
  step: Step;
}

interface Action {
  handle: (transactionContext: TransactionContext) => any;
}


class TypingAction implements Action {
  handle({view, tr, step, blockHeights}: TransactionContext) {
    const {$from} = tr.selection;
    //const blockNode = tr.doc.resolve($from.pos).blockRange($from);
    const block = view.domAtPos($from.pos - 1).node as HTMLElement;
    const index = tr.doc.resolve($from.pos - 1).index(0);
    blockHeights[index].height = block.getBoundingClientRect().height; 
  }
}

class ClickingAction implements Action {
  handle() {
    // do nothing
  }
}

// class InsertAction implements Action {
//   constructor(
//     public tr: Transaction,
//     public step: ReplaceStep
//   ) {}

//   handle(view?: EditorView): number[] {
//     const typing =
//       this.step.slice.content.size === 1 && !this.tr.getMeta('paste');
//     if (typing) {
//       if (view) {
//         const block = view.domAtPos(this.step.from).node as HTMLElement;
//         const index = this.tr.selection.$from.index(1);

//         // console.log(block.textContent, block.offsetHeight);
//         return [index, block.offsetHeight];
//       }
//     }

//     // paste
//     return [];
//   }
// }

// class DeleteAction implements Action {
//   constructor(
//     public tr: Transaction,
//     public step: ReplaceStep
//   ) {}

//   handle(): number[] {
//     // console.log('delete action');
//     return [];
//   }
// }
