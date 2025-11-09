import {
  deleteTable,
  selectedRect,
  tableNodeTypes,
} from '@app/prosemirror/modules/table';
import { insertNewPage } from '../commands/page';
import { Menu, MenuItem } from './menu';
import { EditorView } from 'prosemirror-view';
import { contains } from 'prosemirror-utils';
import { liftListItem } from 'prosemirror-schema-list';
import { fixTable, fixTables } from '@app/prosemirror/modules/table/fixtables';
import { NodeSelection } from 'prosemirror-state';
import { normalizeSelection } from '@app/prosemirror/modules/table/cellselection';

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
      tr.setSelection(NodeSelection.create(tr.doc, rowEndPos + 1))
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
    new MenuItem('insertNewPage2', 'Insert new page', (view) =>
      insertNewPage(view, 1)
    )
  );
  menu.add(
    new MenuItem('insertNewPage3', 'Insert new page', (view) =>
      insertNewPage(view, 1)
    )
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
