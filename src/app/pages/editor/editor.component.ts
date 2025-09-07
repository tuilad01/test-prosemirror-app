import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  model,
  ModelSignal,
  OnDestroy,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Mark } from 'prosemirror-model';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageSchema } from '@app/prosemirror/schema/page-schema';
import { Node } from 'prosemirror-model';
import { selectionPlugin } from '@app/prosemirror/plugins/selection-plugin';
import { Router } from '@angular/router';
import { editableHeaderNodeName } from '@app/prosemirror/nodes/editable-header-nodeview';
import { headerNodeName } from '@app/prosemirror/nodes/page-header';
import { decorationPlugin } from '@app/prosemirror/plugins/decoration-plugin';
import {
  imageBlockNodeName,
  ImageBlockNodeView,
} from '@app/prosemirror/nodes/image-block';
import { customListNodeName } from '@app/prosemirror/nodes/custom-list';
import {
  customListItemNodeName,
  customListItemNodeView,
} from '@app/prosemirror/nodes/custom-list-item';
import { keymap } from 'prosemirror-keymap';
import {
  cellAround,
  columnResizing,
  fixTables,
  goToNextCell,
  selectedRect,
  tableEditing,
  TableMap,
} from '../../prosemirror/modules/table/index';
import {
  distributeSelectedColumnsWidth,
  handleDistributeCells,
  handleInsertTable,
  handleSetBorderNone,
  handleSplitTable,
  insertTable,
  TableBorder,
} from './commands/table';
import { lift, toggleMark } from 'prosemirror-commands';
import { liftListItem } from 'prosemirror-schema-list';
import {
  splitTable,
  splitTablePlugin,
} from '@app/prosemirror/plugins/split-table-plugin';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { initalDocument } from './document';
import {
  handleInsertEditableHeader,
  handleInsertHeader,
  insertNewPage,
} from './commands/page';
import {
  handleEnter,
  handleEnterFontFamily,
  handleToggleFontSize,
  increaseFontSize,
} from './commands/mark';
import { insertImage } from './commands/image';
import { handleRemoveList } from './commands/list';
@Component({
  selector: 'app-editor',
  imports: [FormsModule, MenubarModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class EditorComponent implements OnDestroy {
  handleEnter = handleEnter;
  handleEnterFontFamily = handleEnterFontFamily;
  menuItems: MenuItem[] = [
    {
      id: 'insertNewPage',
      label: 'Insert new page',
      command: () => insertNewPage(this.view, 1),
    },
    {
      id: 'exportJSon',
      label: 'Export JSON',
      command: () => this.exportJSon(),
    },
    {
      id: 'findNextBlock',
      label: 'Find next block',
      command: () => this.findNextBlock(),
    },
    {
      id: 'increaseFontSize',
      label: 'Increase font size',
      command: () => increaseFontSize(this.view),
    },
    { id: 'keepFocus', label: 'Keep focus', command: () => this.keepFocus() },
    { id: 'navigate', label: 'Navigate', command: () => this.navigate() },
    {
      id: 'insertImage',
      label: 'Insert image',
      command: () => insertImage(this.view),
    },

    {
      id: 'insertEditableHeader',
      label: 'Insert editable header',
      command: () => handleInsertEditableHeader(this.view),
    },
    {
      id: 'insertHeader',
      label: 'Insert header',
      command: () => handleInsertHeader(this.view),
    },
    {
      id: 'insertTable',
      label: 'Insert table',
      command: () => handleInsertTable(this.view),
    },
    {
      id: 'distributeCells',
      label: 'Distribute cells',
      command: () => handleDistributeCells(this.view),
    },

    {
      id: 'toggleFontSize',
      label: 'Set font size 40',
      command: () => handleToggleFontSize(this.view),
    },

    {
      id: 'removeList',
      label: 'Remove list',
      command: () => handleRemoveList(this.view),
    },
    {
      id: 'splitTable',
      label: 'Split table',
      command: () => handleSplitTable(this.view),
    },
    {
      id: 'setBorderNone',
      label: 'Set border none',
      command: () => handleSetBorderNone(this.view),
    },
  ];
  index = 0;
  textFontFamilyInput = model<string | undefined>();
  textFontSizeInput: ModelSignal<number | undefined> = model<
    number | undefined
  >();
  fontSize = 20;
  mySchema = pageSchema;
  view!: EditorView;
  pageNumber: number = 1;
  editorRef = viewChild<ElementRef<HTMLDivElement>>('editor');
  
  private router = inject(Router);

  constructor() {
    effect(() => {
      const textFontSizeInput = this.textFontSizeInput();
    });

    afterNextRender(() => {
    });
  }

  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  ngAfterViewInit(): void {
    this.initEditor();
  }

  navigate() {
    const url = this.router.routerState.snapshot.url.includes('create')
      ? 'editor/123'
      : 'editor/create';
    //this.router.navigate([url], { onSameUrlNavigation: 'reload',  });
    window.location.replace('/#/' + url);
  }

  keepFocus() {
    this.view?.focus();
  }

  findNextBlock() {}

  exportJSon() {
    console.log(this.view?.state.doc.toJSON());
  }

  private initEditor() {
    const doc = Node.fromJSON(this.mySchema, initalDocument);

    const findNextBlock = (transaction: Transaction) => {
      const nodeAfter = Selection.findFrom(
        transaction.doc.resolve(transaction.selection.$from.after() + 1),
        1,
        false
      );
      if (nodeAfter) {
        // console.log('next block', nodeAfter);
        return;
      }

      // console.log('next block not found');
    };

    const findPreviousBlock = (transaction: Transaction) => {
      const previousBlock = Selection.findFrom(
        transaction.doc.resolve(transaction.selection.$from.before() - 1),
        -1,
        false
      );
      if (previousBlock) {
        // console.log('previous block', previousBlock);
        return;
      }

      // console.log('previous block not found');
    };
    const editorDom = this.editorRef();
    console.log('editorDom', editorDom);
    if (!editorDom || !editorDom.nativeElement) {
      console.error('ERROR. Not found editor dom with id #editor.');
    }
    const editorElements = document.querySelectorAll('#editor');
    //this.view = new EditorView(editorDom!.nativeElement as HTMLElement, {
    let state = EditorState.create({
      schema: this.mySchema,
      doc: doc,

      plugins: [
        //enterPlugin,
        columnResizing(),
        tableEditing(),
        keymap({
          Tab: goToNextCell(1),
          'Shift-Tab': goToNextCell(-1),
        }),
        splitTablePlugin,
        ...exampleSetup({ schema: this.mySchema }),
        selectionPlugin(this.view),
        //footerPlugin,
        decorationPlugin,
        //pageBreakPlugin2(this.view),
      ],
    });

    const fix = fixTables(state);
    if (fix) {
      state = state.apply(fix.setMeta('addToHistory', false));
    }
    this.view = new EditorView(editorElements[editorElements.length - 1], {
      state: state,
      attributes: {
        class: 'editor-content',
      },
      nodeViews: {
        [imageBlockNodeName]: (node, view, getPos, decorations) => {
          return new ImageBlockNodeView(node, view, getPos, decorations);
        },
        [customListItemNodeName]: (node, view, getPos, decorations) => {
          return new customListItemNodeView(node, view, getPos, decorations);
        },
      },
      dispatchTransaction: (tr: Transaction) => {
        const view = this.view!,
          { state } = view,
          newTransaction = state.tr;
        const originPosition = tr.selection.to;
        const defaultFontSize = 16;

        this.index = tr.selection.from;

        view.updateState(state.apply(tr));
      },
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }
}
