import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { pageSchema } from '../prosemirror-schema/page-schema';
import { EditorView } from 'prosemirror-view';
import { DOMSerializer, Fragment, Node, Schema } from 'prosemirror-model';
import { nodes } from 'prosemirror-schema-basic';

function repaginate(view: EditorView, pageHeightPx = 700) {
  const { state } = view;
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
  const measured = measureBlockHeights(blocks, schema, tempContainer, view);
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
  view.dispatch(tr);
}

function measureBlockHeights(
  blocks: Node[],
  schema: Schema,
  container: HTMLElement,
  editorView: EditorView
) {
  container.innerHTML = ''; // Clear previous content
  const domSerializer = DOMSerializer.fromSchema(schema);
  // editorView.someProp('domSerializer') || editorView.domSerializer;
  const heights: { block: Node; height: number }[] = [];
  blocks.forEach((block) => {
    const dom = domSerializer.serializeNode(block) as Element;
    container.appendChild(dom);
    const height = dom.getBoundingClientRect().height + 16; // because for each p has margin 16px

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
            repaginate(view);
          }
        },
      };
    },
  });
}
