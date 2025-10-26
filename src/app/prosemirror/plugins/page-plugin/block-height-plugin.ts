import { PluginKey, Plugin, Transaction, EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ReplaceStep, Step } from 'prosemirror-transform';
import { Node } from 'prosemirror-model';

const documentHeightPluginKey = new PluginKey('document-height-plugin-key');

interface BlockHeight {
  type: string;
  height: number;
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
        blockHeights.push({
          type: node.type.name,
          height: block.getBoundingClientRect().height,
        });
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
        console.log(action, 'action');
        if (action) {
          action.handle({
            view: editorView!,
            blockHeights,
            tr,
            step,
            measurementView: config.measurementView,
          });
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

      // if (deleted && !inserted) {
      //   return new RemoveAction();
      // }

      // return EnterAction
      const isStructuralSplit =
        !deleted && inserted && step.slice.openStart === step.slice.openEnd;

      if (isStructuralSplit) {
        return new EnterAction();
      }
    }

    return new UnknownAction();
  }
}

interface TransactionContext {
  view: EditorView;
  blockHeights: BlockHeight[];
  tr: Transaction;
  step: Step;
  measurementView?: EditorView;
}

interface Action {
  handle: (transactionContext: TransactionContext) => any;
}

class TypingAction implements Action {
  handle({ view, tr, step, blockHeights }: TransactionContext) {
    const { $from } = tr.selection;
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

class RemoveAction implements Action {
  handle() {}
}

class EnterAction implements Action {
  handle(transactionContext: TransactionContext) {
    // 1. Getting block indexes.
    const step = transactionContext.step as ReplaceStep;
    const doc = transactionContext.tr.doc;
    const blockRange = doc.resolve(step.from).blockRange(doc.resolve(step.to));
    let { startIndex, endIndex } = blockRange!;
    if (blockRange?.parent.type.name !== 'doc') {
      startIndex = blockRange?.$from.index(0)!;
      endIndex = blockRange?.$to.index(0)!;
    }

    const { measurementView } = transactionContext;
    const { dispatch, state } = measurementView!;
    const { tr } = state;
    // 2. Getting nodes from transaction doc.
    const content: Node[] = [];
    for (let index = startIndex; index <= endIndex; index++) {
      const node = doc.child(index);
      content.push(node);
    }

    // 3. render in measurement view
    const docContentSize = state.doc.content.size;
    tr.replaceWith(
      0,
      docContentSize,
      state.schema.nodes['doc'].create(null, content)
    );
    dispatch(tr);

    // 4. Getting block heights
    for (let index = startIndex; index < endIndex + 1; index++) {
      if (index === startIndex) {
        transactionContext.blockHeights[index].height =
          measurementView!.dom.firstElementChild!.getBoundingClientRect().height;
        continue;
      }

      transactionContext.blockHeights.splice(index - 1, 0, {
        type: content[endIndex - index].type.name,
        height:
          measurementView!.dom.children[
            endIndex - index
          ].getBoundingClientRect().height,
      });
    }
  }
}

class UnknownAction implements Action {
  handle(transactionContext: TransactionContext) {
    transactionContext.blockHeights = measureDocument(transactionContext.measurementView!, transactionContext.tr.doc);
  }
}

function measureDocument(measurementView: EditorView, doc: Node) {
  const { dispatch, state } = measurementView;
  const { tr } = state;

  tr.replaceWith(0, state.doc.content.size, doc.content);
  dispatch(tr);

  const blockHeights: BlockHeight[] = [];
  const getBlock = (element: HTMLElement) => {
    let current: HTMLElement | null | undefined = element;
    while (current && current.parentElement !== measurementView.dom) {
      current = current?.parentElement;
    }
    return current;
  };
  state.doc.forEach((node, offset) => {
    blockHeights.push({
      type: node.type.name,
      height: getBlock(measurementView.domAtPos(offset + 1).node as HTMLElement)?.getBoundingClientRect().height ?? 0,
    });
  });

  return blockHeights;
}
