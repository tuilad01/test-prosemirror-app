import {
  deleteTable,
  selectedRect,
  TableMap,
  tableNodeTypes,
} from '@app/prosemirror/modules/table';
import { insertNewPage } from '../commands/page';
import { Menu, MenuItem } from './menu';
import { EditorView } from 'prosemirror-view';
import { contains } from 'prosemirror-utils';
import { bulletList, liftListItem, wrapInList, wrapRangeInList } from 'prosemirror-schema-list';
import { fixTable, fixTables } from '@app/prosemirror/modules/table/fixtables';
import { NodeSelection } from 'prosemirror-state';
import {
  CellSelection,
  normalizeSelection,
} from '@app/prosemirror/modules/table/cellselection';
import { Fragment, NodeRange } from 'prosemirror-model';
import { liftTarget } from 'prosemirror-transform';

export const getDefaultMenu = () => {
  const menu = new Menu();

  menu.add(
    new MenuItem('splitListBullet', 'Split List Bulletin', (view) => {
      const { state, dispatch } = view;
      const { selection, tr } = state;

      tr.split(selection.from, 2);

      dispatch(tr);
    })
  );
  menu.add(
    new MenuItem('liftList', 'Lift List', (view) => {
      const { state, dispatch } = view;
      const { selection, tr } = state;
      liftListItem(state.schema.nodes['list_item'])(state, dispatch);

      // dispatch(tr);
    })
  );
  menu.add(
    new MenuItem('joinBlock', 'Join Block', (view) => {
      const { state, dispatch } = view;
      const { selection, tr } = state;
      tr.join(selection.$from.before(1), 1);

      dispatch(tr);
    })
  );
  menu.add(
    new MenuItem('splitTable', 'Split table', (view) => {
      const { state, dispatch } = view;
      const { selection, tr } = state;
      const tableRect = selectedRect(state);
      const tableEnd = tableRect.tableStart + tableRect.table.content.size;
      const rowEndPos = selection.$from.after(selection.$from.depth - 2);
      if (rowEndPos === tableEnd) {
        console.warn('WARN. Cannot split the last row of the table.');
        return;
      }
      const rowIndex = selection.$from.index(1);
      console.log(rowIndex, 'rowIndex');
      tr.split(rowEndPos, 1);
      tr.setSelection(NodeSelection.create(tr.doc, rowEndPos + 1));
      dispatch(tr);
      const newTr = view.state.tr;
      normalizeSelection(view.state, newTr, true);
      if (newTr.docChanged) {
        console.log('ther is newTr');

        dispatch(newTr);
      }

      // fixTables(view.state, state);

      const nodeAfter = view.state.doc.resolve(rowEndPos + 2);
      console.log(nodeAfter, 'nodeAfter');
    })
  );

  menu.add(
    new MenuItem('selectRectTable', 'Select Table Rect', (view) => {
      const { state, dispatch } = view;
      const { schema } = state;
      const tableRect = selectedRect(state);
      const tableEnd = tableRect.tableStart + tableRect.table.content.size;
      const map = tableRect.map;
      const cellSelection = new CellSelection(
        state.doc.resolve(tableRect.tableStart + map.map[5]),
        state.doc.resolve(tableRect.tableStart + map.map[map.map.length - 1])
      );

      const { tr } = state;
      const content = cellSelection.content();
      const table = schema.nodes['table'].create(
        tableRect.table.attrs,
        content.content
      );
      tr.insert(tableEnd + 1, table);
      dispatch(tr);
    })
  );
  menu.add(
    new MenuItem('switchList', 'Switch list (bullet/ordered)', (view) => {
      const { state, dispatch } = view;
      const { schema, selection, tr } = state;
      const { $from, $to } = selection;
      const blockRange = $from.blockRange($to);


      if (
        blockRange?.parent.type.name === 'bullet_list' ||
        blockRange?.parent.type.name === 'ordered_list'
      ) {
        const reverseNodeTypeName = blockRange.parent.type.name === 'bullet_list' ? 'ordered_list' : 'bullet_list';
        const block = selection.$from.node(1);
        tr.setNodeMarkup(
          selection.$from.before(1),
          schema.nodes[reverseNodeTypeName],
          block.attrs,
          block.marks
        );
        dispatch(tr);
      } else if (blockRange?.parent.type.name === 'list_item') {
        if (liftListItem(schema.nodes['list_item'])(state,dispatch)) {
          // success lift list item
        }
      } else if (blockRange?.parent.type.name === 'doc') {
        // const listPostions: {start: number, end: number}[] = [];
        // let pos = blockRange.start;
        // for (let index = blockRange.startIndex; index < blockRange.endIndex; index++) {
        //   const child = blockRange.parent.child(index);
        //   if (child.type.name === 'bullet_list' || child.type.name === 'ordered_list') {
        //     listPostions.push({start: pos, end: pos + child.nodeSize})
        //   }

        //   pos += child.nodeSize;
        // }

        // if (listPostions.length) {
        //   console.log('1. lift lists');
          
        //   for (const listPos of listPostions) {
        //     const start = tr.mapping.map(listPos.start);
        //     const end = tr.mapping.map(listPos.end);
        //     tr.lift(new NodeRange(tr.doc.resolve(start), tr.doc.resolve(end), 1), 0);
        //   }
        // }

        const from = tr.mapping.map(blockRange.$from.pos);
        const to = tr.mapping.map(blockRange.$to.pos);
        const blockRangeMap = new NodeRange(tr.doc.resolve(from), tr.doc.resolve(to), 1);
        if (wrapRangeInList(tr, blockRangeMap, schema.nodes['bullet_list'])) {
          console.log('2. wrap list');
          dispatch(tr);
        }
      }
    })
  );
  menu.add(
    new MenuItem('insertNewPage4', 'Insert new page', (view) =>
      insertNewPage(view, 1)
    )
  );
  menu.add(
    new MenuItem(
      'isnertDom',
      'insert dom to measurement view',
      (view, options) => {
        if (!options?.measurementView) {
          return;
        }
      }
    )
  );
  menu.add(
    new MenuItem('swapDom', 'swap elements', (view, options) => {
      console.log('swap elements');
      const { state } = view;
      const { $from, $to } = state.selection;

      const para2 = view.dom.children[2];
      const para3 = view.dom.children[3];

      const temp = document.createElement('div');

      para2.parentNode?.insertBefore(temp, para2);

      // para3.parentNode?.insertBefore(para3, para2);

      temp.parentNode?.insertBefore(para3, temp);

      temp.parentNode?.removeChild(temp);

      console.log(view.state.doc, 'view.state.doc');
    })
  );

  return menu;
};

// MenuItem[] = [
//   {
//     id: 'insertNewPage',
//     label: 'Insert new page',
//     command: (view: EditorView) => {
//       insertNewPage(view, 1);
//     },
//   },
//   {
//     id: 'deleteTable',
//     label: 'Delete table',
//     command: (view: EditorView) => deleteTable(this.view.state, this.view.dispatch),
//   },
//   {
//     id: 'exportJSon',
//     label: 'Export JSON',
//     command: (view: EditorView) => this.exportJSon(),
//   },
//   {
//     id: 'findNextBlock',
//     label: 'Find next block',
//     command: (view: EditorView) => this.findNextBlock(),
//   },
//   {
//     id: 'increaseFontSize',
//     label: 'Increase font size',
//     command: (view: EditorView) => increaseFontSize(this.view),
//   },
//   { id: 'keepFocus', label: 'Keep focus', command: (view: EditorView) => this.keepFocus() },
//   { id: 'navigate', label: 'Navigate', command: (view: EditorView) => this.navigate() },
//   {
//     id: 'insertImage',
//     label: 'Insert image',
//     command: (view: EditorView) => insertImage(this.view),
//   },

//   {
//     id: 'insertEditableHeader',
//     label: 'Insert editable header',
//     command: (view: EditorView) => handleInsertEditableHeader(this.view),
//   },
//   {
//     id: 'insertHeader',
//     label: 'Insert header',
//     command: (view: EditorView) => handleInsertHeader(this.view),
//   },
//   {
//     id: 'insertTable',
//     label: 'Insert table',
//     command: (view: EditorView) => handleInsertTable(this.view),
//   },
//   {
//     id: 'distributeCells',
//     label: 'Distribute cells',
//     command: (view: EditorView) => handleDistributeCells(this.view),
//   },

//   {
//     id: 'toggleFontSize',
//     label: 'Set font size 40',
//     command: (view: EditorView) => handleToggleFontSize(this.view),
//   },

//   {
//     id: 'removeList',
//     label: 'Remove list',
//     command: (view: EditorView) => handleRemoveList(this.view),
//   },
//   {
//     id: 'splitTable',
//     label: 'Split table',
//     command: (view: EditorView) => handleSplitTable(this.view),
//   },
//   {
//     id: 'setBorderNone',
//     label: 'Set border none',
//     command: (view: EditorView) => handleSetBorderNone(this.view),
//   },
//   {
//     id: 'zooomInEditor',
//     label: 'Zooom In',
//     command: (view: EditorView) => zoomIn(),
//   },
//   {
//     id: 'zooomOutEditor',
//     label: 'Zooom Out',
//     command: (view: EditorView) => zoomOut(),
//   },
// ];
