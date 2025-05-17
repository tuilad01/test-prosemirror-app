import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { pageSchema } from '../prosemirror-schema/page-schema';
import { EditorView } from 'prosemirror-view';
import { DOMSerializer, Fragment, Node, Schema } from 'prosemirror-model';
import { nodes } from 'prosemirror-schema-basic';
export function repaginate2(transaction: Transaction, pageHeightPx = 700) {
  // Flatten all blocks
  const blocks: Node[] = [];
  transaction.doc.forEach((pageNode) => {
    pageNode.forEach((block) => {
      blocks.push(block);
    });
  });
  // Create temporary container for measurement
  let tempContainer = document.getElementById('pm-pagination-measure');
  if (!tempContainer) {
    tempContainer = document.createElement('div');
    tempContainer.id = 'pm-pagination-measure';
    tempContainer.style.cssText = `
            position: absolute;
            visibility: hidden;
            top: 0;
            left: 0;
            width: 595px;
            padding: 20px;
            box-sizing: border-box;
            z-index: -1;
        `;
    document.body.appendChild(tempContainer);
  }
  const measured = measureBlockHeights(blocks, pageSchema, tempContainer);
  const pages = [];
  let current = [];
  let currentHeight = 0;
  for (const { block, height } of measured) {
    if (currentHeight + height > pageHeightPx && current.length > 0) {
      pages.push(current);
      current = [];
      currentHeight = 0;
    }
    current.push(block);
    currentHeight += height;
  }

  if (current.length > 0) {
    pages.push(current);
  }
  const pageNodes = pages.map((blocks, index) =>
    pageSchema.nodes['page'].createAndFill(
      { 'page-number': ++index },
      Fragment.fromArray(blocks)
    )
  );
  const newDoc = pageSchema.nodes['doc'].createAndFill(
    null,
    Fragment.fromArray(pageNodes.filter((pageNode) => !!pageNode))
  );
  if (!newDoc || newDoc.eq(transaction.doc)) {
    return;
  }

  const tr = transaction.replaceWith(
    0,
    transaction.doc.content.size,
    newDoc.content
  );
  return tr;
}
export function repaginate(state: EditorState, pageHeightPx = 700) {
  const { schema } = state;
  // Flatten all blocks
  const blocks: Node[] = [];
  state.doc.forEach((pageNode) => {
    pageNode.forEach((block) => {
      blocks.push(block);
    });
  });
  // Create temporary container for measurement
  let tempContainer = document.getElementById('pm-pagination-measure');
  if (!tempContainer) {
    tempContainer = document.createElement('div');
    tempContainer.id = 'pm-pagination-measure';
    tempContainer.style.cssText = `
            position: absolute;
            visibility: hidden;
            top: 0;
            left: 0;
            width: 595px;
            padding: 20px;
            box-sizing: border-box;
            z-index: -1;
        `;
    document.body.appendChild(tempContainer);
  }
  const measured = measureBlockHeights(blocks, schema, tempContainer);
  const pages = [];
  let current = [];
  let currentHeight = 0;
  for (const { block, height } of measured) {
    if (currentHeight + height > pageHeightPx && current.length > 0) {
      pages.push(current);
      current = [];
      currentHeight = 0;
    }
    current.push(block);
    currentHeight += height;
  }

  if (current.length > 0) {
    pages.push(current);
  }
  const pageNodes = pages.map((blocks, index) =>
    schema.nodes['page'].createAndFill(
      { 'page-number': ++index },
      Fragment.fromArray(blocks)
    )
  );
  const newDoc = schema.nodes['doc'].createAndFill(
    null,
    Fragment.fromArray(pageNodes.filter((pageNode) => !!pageNode))
  );
  if (!newDoc || newDoc.eq(state.doc)) {
    return;
  }

  const tr = state.tr.replaceWith(0, state.doc.content.size, newDoc.content);
  return tr;
}

export function measureBlockHeights(
  blocks: Node[],
  schema: Schema,
  container: HTMLElement
) {
  container.innerHTML = ''; // Clear previous content
  const domSerializer = DOMSerializer.fromSchema(schema);
  // editorView.someProp('domSerializer') || editorView.domSerializer;
  const heights: { block: Node; height: number }[] = [];
  blocks.forEach((block) => {
    const dom = domSerializer.serializeNode(block) as Element;
    container.appendChild(dom);
    let height = dom.getBoundingClientRect().height;
    if (height === 0) {
      height = 18;
    }
    height += 16; // because for each p has margin 16px

    heights.push({ block, height });
  });
  return heights;
}

// Create a custom plugin that checks for page overflow after each transaction
export function pageBreakPlugin2(view: EditorView | undefined) {
  let editorView: EditorView;

  return new Plugin({
    view(view) {
      editorView = view;
      return {
        update(view, prevState) {
          if (view.state.doc.eq(prevState.doc)) {
            console.log('view plugin running');
            const tr = repaginate(view.state);
            if (tr) {
              view.dispatch(tr);
            }
          }
        },
      };
    },
  });
}
