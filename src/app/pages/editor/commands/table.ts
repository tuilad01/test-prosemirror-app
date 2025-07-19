import { EditorState, Transaction } from 'prosemirror-state';
import { SchemaNode } from '../nodes/const';
import { CellSelection, TableMap, selectedRect } from 'prosemirror-tables';
import { findParentNodeOfType } from 'prosemirror-utils';

export const insertTable =
  (rows: number, cols: number) =>
  (state: EditorState, dispatch?: (tr: any) => void) => {
    if (!dispatch) return false;

    const { schema } = state;

    const node = new SchemaNode(schema);
    const tableNode = node.table;
    const tableRowNode = node.tableRow;
    const tableCellNode = node.tableCell;
    const paragraphNode = node.paragraph;

    if (!tableNode || !tableRowNode || !tableCellNode || !paragraphNode) {
      console.error('Table nodes or paragraph node not defined in schema.');
      return false;
    }

    // Create a single cell with an empty paragraph inside
    const createCell = () => tableCellNode.create(null, paragraphNode.create());

    // Create a row with `cols` number of cells
    const createRow = () => {
      const cells = [];
      for (let i = 0; i < cols; i++) {
        cells.push(createCell());
      }
      return tableRowNode.create(null, cells);
    };

    // Create the table with `rows` number of rows
    const tableContent = [];
    for (let i = 0; i < rows; i++) {
      tableContent.push(createRow());
    }
    const newNode = tableNode.create(null, tableContent);

    const tr = state.tr;
    // If the selection is empty, insert at the current position.
    // Otherwise, replace the selection with the new table.
    if (state.selection.empty) {
      tr.replaceSelectionWith(newNode);
    } else {
      tr.replaceSelectionWith(newNode);
    }

    dispatch(tr.scrollIntoView());
    return true;
  };

// Custom command to distribute column widths for selected columns
export const distributeSelectedColumnsWidth = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => {
  const { selection, schema } = state;
  const {
    table: tableType,
    table_cell: cellType,
    table_header: headerType,
  } = schema.nodes;

  // Ensure we are inside a table and have a cell selection
  if (!(selection instanceof CellSelection)) {
    console.log(
      'Please select cells within a table to distribute column widths.'
    );
    return false;
  }

  // Find the parent table node from the selection
  const tableNodeWithPos = findParentNodeOfType(tableType)(selection);
  if (!tableNodeWithPos) {
    console.log('No table found at the current selection.');
    return false;
  }

  const table = tableNodeWithPos.node;
  const tableStart = tableNodeWithPos.pos + 1; // +1 to get inside the table node content
  const map = TableMap.get(table);
  const rect = selectedRect(state); // Get the rectangle of selected cells

  // Get the unique column indices that are part of the selection
  const selectedColumnIndices: number[] = [];
  for (let col = rect.left; col < rect.right; col++) {
    selectedColumnIndices.push(col);
  }

  if (selectedColumnIndices.length === 0) {
    console.log('No columns selected for distribution.');
    return false;
  }

  // Define the target width for each selected column.
  // For this example, we'll set a fixed width of 100 pixels.
  // You could calculate this dynamically based on total table width,
  // average of existing widths, or user input.
  const targetColWidth = 100; // pixels

  let tr = state.tr;
  let changed = false;

  // Iterate through each cell in the table
  console.log('map.map', map.map);
  map.cellsInRect(rect).forEach((_cellPos) => {
    // Check if this cell's column index is among the selected columns
    //if (selectedColumnIndices.includes(colIdx)) {
    const cellAbsPos = tableStart + _cellPos;
    const cell = state.doc.nodeAt(cellAbsPos);

    // Ensure it's a table cell or header cell
    if (cell && (cell.type === cellType || cell.type === headerType)) {
      // Check if the cell's current colwidth is different from the target
      const { colwidth } = cell.attrs;
      if (colwidth !== targetColWidth) {
        const updatedAttrs = { ...cell.attrs, colwidth: [targetColWidth] };
        const updatedCell = cell.type.create(updatedAttrs, cell.content);
        // Replace the old cell with the new one in the transaction
        tr.replaceWith(cellAbsPos, cellAbsPos + cell.nodeSize, updatedCell);
        changed = true;
      }
    }
    //}
  });

  // Dispatch the transaction if any changes were made
  if (changed && dispatch) {
    dispatch(tr.scrollIntoView());
    return true;
  }

  return false;
};
