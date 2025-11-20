import {
  Component,
  effect,
  ElementRef,
  model,
  ModelSignal,
  OnDestroy,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  customListItemNodeName,
  customListItemNodeView,
} from '@app/prosemirror/nodes/custom-list-item';
import {
  imageBlockNodeName,
  ImageBlockNodeView,
} from '@app/prosemirror/nodes/image-block';
import { decorationPlugin } from '@app/prosemirror/plugins/decoration-plugin';
import { blockHeightPlugin } from '@app/prosemirror/plugins/page-plugin/block-height-plugin';
import { pageSchema } from '@app/prosemirror/schema/page-schema';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { Node } from 'prosemirror-model';
import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  columnResizing,
  fixTables,
  goToNextCell,
  tableEditing,
  TableView
} from '../../prosemirror/modules/table/index';
import {
  handleEnter,
  handleEnterFontFamily
} from './commands/mark';
import { commonDocument } from './data/common';
import { getDefaultMenu } from './menu/default-menu';
import { Menu } from './menu/menu';
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
  measurementView!: EditorView;
  pageNumber: number = 1;

  editorRef = viewChild<ElementRef<HTMLDivElement>>('editor');
  measurementEditorRef =
    viewChild<ElementRef<HTMLDivElement>>('measurementEditor');

  tableNodeViews: TableView[] = [];

  //private router = inject(Router);

  constructor() {
    this.menu = getDefaultMenu();
    this.menuItems = this.menu.items.map((item) => ({
      ...item,
      command: () =>
        item.command(this.view, { measurementView: this.measurementView }),
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
    // const strDocument = JSON.stringify(initalDocument);
    // // let combinedDocuments: Node | null = combineDocuments(this.mySchema, [strDocument, strDocument]);
    // let combinedDocuments: Node | null = combineJsonDocuments(this.mySchema, [
    //   strDocument,
    //   strDocument,
    
    // ]);
    // console.log(combinedDocuments);

    // const doc = Node.fromJSON(this.mySchema, table5x10WithMergedRows);
    const doc = Node.fromJSON(this.mySchema, commonDocument)
    // const doc = combinedDocuments!;
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

    const stateForMeasurementView = EditorState.create({
      schema: this.mySchema,
      plugins: [
        columnResizing(),
        tableEditing(),
        ...exampleSetup({ schema: this.mySchema, menuBar: false }),
      ],
    });
    this.measurementView = new EditorView(
      this.measurementEditorRef()!.nativeElement,
      {
        state: stateForMeasurementView,
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
      }
    );

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
        // blockHeightPlugin({ measurementView: this.measurementView }),
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
