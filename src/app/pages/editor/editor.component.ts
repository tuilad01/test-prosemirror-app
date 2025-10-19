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
import { Fragment, Mark } from 'prosemirror-model';
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
  deleteTable,
  fixTables,
  goToNextCell,
  selectedRect,
  tableEditing,
  TableMap,
  TableView,
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
import { Transform } from 'prosemirror-transform';
import {
  combineDocuments,
  combineJsonDocuments,
} from '@app/prosemirror/common/common';
import { zoomIn, zoomIn2, zoomOut } from './commands/editor';
import { getDefaultMenu } from './menu/default-menu';
import { Menu } from './menu/menu';
import { blockHeightPlugin } from '@app/prosemirror/plugins/page-plugin/block-height-plugin';
import { EditorViewService } from './services/editor-view.service';
@Component({
  selector: 'app-editor',
  imports: [FormsModule, MenubarModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [EditorViewService],
})
export class EditorComponent implements OnDestroy {
  handleEnter = handleEnter;
  handleEnterFontFamily = handleEnterFontFamily;
  readonly menu: Menu;
  menuItems: MenuItem[] = [];

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
  tableNodeViews: TableView[] = [];

  //private router = inject(Router);

  constructor() {
    this.menu = getDefaultMenu();
    this.menuItems = this.menu.items.map((item) => ({
      ...item,
      command: () => item.command(this.view),
    }));

    effect(() => {
      const textFontSizeInput = this.textFontSizeInput();
    });


  }

  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  ngAfterViewInit(): void {
    this.initEditor();
  }

  navigate() {
    // const url = this.router.routerState.snapshot.url.includes('create')
    //   ? 'editor/123'
    //   : 'editor/create';
    // //this.router.navigate([url], { onSameUrlNavigation: 'reload',  });
    // window.location.replace('/#/' + url);
  }

  keepFocus() {
    this.view?.focus();
  }

  findNextBlock() {}

  exportJSon() {
    console.log(this.view?.state.doc.toJSON());
  }
  // init editor view
  private initEditor() {
    const strDocument = JSON.stringify(initalDocument);
    // let combinedDocuments: Node | null = combineDocuments(this.mySchema, [strDocument, strDocument]);
    let combinedDocuments: Node | null = combineJsonDocuments(this.mySchema, [
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
      strDocument,
    ]);
    console.log(combinedDocuments);

    // const doc = Node.fromJSON(this.mySchema, initalDocument);
    const doc = combinedDocuments!;
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
        // splitTablePlugin,
        ...exampleSetup({ schema: this.mySchema, menuBar: false }),
        // selectionPlugin(this.view),
        //footerPlugin,
        decorationPlugin,
        //pageBreakPlugin2(this.view),
        blockHeightPlugin(),
      ],
    });

    const fix = fixTables(state);
    if (fix) {
      state = state.apply(fix.setMeta('addToHistory', false));
    }
    this.view = new EditorView(this.editorRef()!.nativeElement, {
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
