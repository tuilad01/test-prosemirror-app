import { deleteTable } from '@app/prosemirror/modules/table';
import { insertNewPage } from '../commands/page';
import { Menu, MenuItem } from './menu';
import { EditorView } from 'prosemirror-view';

export const getDefaultMenu = () => {
  const menu = new Menu();

  menu.add(
    new MenuItem('insertNewPage1', 'Insert new page', (view) =>
      insertNewPage(view, 1)
    )
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
    new MenuItem('isnertDom', 'insert dom to measurement view', (view, options) => {
      if (!options?.measurementView) {
        return;
      }

      
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
