import { headerNodeName } from '@app/prosemirror/nodes/page-header';
import { Fragment, Node } from 'prosemirror-model';
import {
  PluginKey,
  Plugin,
  EditorState,
  Transaction,
  TextSelection,
} from 'prosemirror-state';
import { cellAround, selectedRect, TableMap } from '../modules/table/index';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { measureBlockHeights2 } from './page-break-plugin2';

export const splitTablePluginKey = new PluginKey('split_table_plugin');

export const splitTablePlugin = new Plugin({
  key: splitTablePluginKey,
  view(_) {
    return {
      update(view, prevState) {
        const transaction = splitTableByHeight(view);
        if (transaction) {
          view.dispatch(transaction);
        }
      },
    };
  },
  // appendTransaction(transactions, oldState, newState) {
  //   const transaction = transactions[0];
  //   const { schema } = newState;
  //   const { $from, $to, $cursor } = newState.selection as TextSelection;

  //   const block = $from.node(1);

  //   if (block.type.name === 'table') {
  //     const [{ height }] = measureBlockHeights2([block], schema);
  //     if (height > 200) {
  //       return splitTableByHeight(newState);
  //     }
  //   }
  //   return null;
  // },
});

export function splitTableByHeight(view: EditorView, maxHeight: number = 200) {
  const { state } = view;
  const { selection } = state;
  const { $from } = selection;

  // Find the parent table node
  // const table = $from.node(1); // Assuming selection is inside a table, get the grandparent node
  // if (!table || table.type.name !== 'table') {
  //   console.warn('Selection is not inside a table.');
  //   return null;
  // }

  if (!cellAround($from)) {
    console.warn('Selection is not inside a table.');
    return null;
  }

  const tableRect = selectedRect(state);
  const tablePos = $from.start(-1) - 1; // Position of the table node
  console.log(
    'tablePos',
    tablePos,
    'tableRect.tableStart',
    tableRect.tableStart,
    state.doc.nodeAt(tableRect.tableStart - 1)?.type.name
  );

  const map = TableMap.get(tableRect.table);
  const tbody = view.domAtPos(tableRect.tableStart).node?.parentElement;
  if (!tbody) {
    console.warn('WARN. Cannot find tbody of table');
    return null;
  }

  if (tbody.offsetHeight < maxHeight) {
    console.log('INFO. Not enough height to split tables.');
    return;
  }

  console.log('INFO. Splitting tables');
  const firstColumnInTable = map.cellsInRect({
    top: 0,
    bottom: map.height,
    left: 0,
    right: 1,
  });
  const tables: {
    pos: number;
    absPos: number;
    lastRowIndex: number;
    rows: Node[];
  }[] = [];
  let height = 0;
  for (const [index, cellPos] of firstColumnInTable.entries()) {
    const cellAbsPos = tableRect.tableStart + cellPos;
    const cell = state.doc.nodeAt(cellAbsPos);
    if (
      cell?.type.name !== 'table_cell' &&
      cell?.type.name !== 'table_header'
    ) {
      continue;
    }

    const cellDom = view.domAtPos(cellAbsPos).node as HTMLElement;
    if (!cellDom) {
      continue;
    }

    if (height + cellDom.offsetHeight > maxHeight) {
      tables.push({
        pos: cellPos,
        absPos: cellAbsPos,
        lastRowIndex: index,
        rows: [],
      });
      height = 0;
    }

    height += cellDom.offsetHeight;
  }

  if (height > 0) {
    tables.push({
      pos: -1,
      absPos: -1,
      lastRowIndex: firstColumnInTable.length - 1,
      rows: [],
    });
  }

  for (let rowIndex = 0; rowIndex < map.height; rowIndex++) {
    const row = tableRect.table.child(rowIndex);
    for (const table of tables) {
      if (table.lastRowIndex > rowIndex) {
        table.rows.push(row);
        break;
      }
    }
  }

  if (tables.length === 1) {
    console.log('INFO. Still 1 table');
    return;
  }

  console.log('tables', tables);
  const { tr } = state;
  const tableNodeType = state.schema.nodes['table'];
  let lastPos = -1;
  for (const [index, table] of tables.entries()) {
    const newTable = tableNodeType.create(null, Fragment.fromArray(table.rows));

    if (index === 0) {
      tr.replaceRangeWith(
        tableRect.tableStart - 1,
        tableRect.tableStart + tableRect.table.nodeSize,
        newTable
      );
      lastPos = tableRect.tableStart + newTable.nodeSize;
      continue;
    }

    if (lastPos <= -1) {
      console.error(
        'ERROR. Something wrong the last position must be poistive integer.'
      );
      continue;
    }

    tr.insert(lastPos, newTable);
    lastPos = lastPos + newTable.nodeSize;
  }

  console.log('Success. Returning transaction to split tables');
  return tr;
}

export function splitTable(state: EditorState, rowIndex: number) {
  const { selection } = state;
  const { $from } = selection;

  // Find the parent table node
  const table = $from.node(1); // Assuming selection is inside a table, get the grandparent node
  if (!table || table.type.name !== 'table') {
    console.warn('Selection is not inside a table.');
    return null;
  }
  const tableRect = selectedRect(state);
  const tablePos = $from.start(-1) - 1; // Position of the table node

  const map = TableMap.get(table);

  if (rowIndex < 0 || rowIndex >= map.height) {
    console.warn('Invalid row index for splitting table.');
    return null;
  }

  let tr = state.tr;

  // 1. Collect rows for the new table
  const rowsToMove = [];
  for (let i = rowIndex; i < map.height; i++) {
    const rowStart = map.map[i * map.width]; // Start position of the first cell in the row
    const rowEnd = map.map[(i + 1) * map.width - 1] + 1; // End position of the last cell in the row

    // Get the row node itself. This might require finding the table_row node based on cell positions.
    // For simplicity, let's assume direct access or iterate through children if needed.
    const rowNode = table.child(i);
    rowsToMove.push(rowNode);
  }

  // 2. Delete rows from the original table
  // Calculate start and end positions for the rows to be deleted within the table node
  // The content of the table is 'table_row[columns=.columns]+'
  // So, the rows start at tablePos + 1 (after the table opening tag)
  const deleteFrom = tablePos + 1 + table.firstChild!.nodeSize * rowIndex; // Approximate start of the row to delete
  const deleteTo = tablePos + 1 + table.nodeSize - 2; // End of the table before its closing tag. This needs refinement.

  // A more robust way to calculate deletion range:
  const firstRowToKeepEnd = map.map[rowIndex * map.width - 1] + 1;
  const rowsToDeleteStart = tablePos + firstRowToKeepEnd;
  const rowsToDeleteEnd = tablePos + table.nodeSize - 2; // End of content within the table

  // Delete the rows that will form the new table from the original table
  // This is tricky as you need to delete nodes within a parent.
  // Instead of deleting from the original table, it's often easier to reconstruct the first table.

  // Option 1: Reconstruct the first table and create a new table
  const newFirstTableRows = [];
  for (let i = 0; i < rowIndex; i++) {
    newFirstTableRows.push(table.child(i));
  }

  const newFirstTable = state.schema.nodes['table'].create(
    table.attrs,
    Fragment.from(newFirstTableRows)
  );
  const newSecondTable = state.schema.nodes['table'].create(
    table.attrs,
    Fragment.from(rowsToMove)
  );

  // Replace the original table with the first part, and insert the second part
  //tr.replaceRangeWith(tablePos, tablePos + table.nodeSize, newFirstTable);
  //tr.insert(tablePos + newFirstTable.nodeSize, newSecondTable);
  tr.replaceRangeWith(
    tableRect.tableStart,
    tableRect.tableStart + table.nodeSize,
    newSecondTable
  );
  tr.insert(tableRect.tableStart, newFirstTable);

  return tr;
}
