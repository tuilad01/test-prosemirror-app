import { AfterViewInit, Component } from '@angular/core';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, NodeSpec } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageNodeSpec } from './prosemirror-nodes/page';
import { pageBreakPlugin } from './prosemirror-plugin/page-break-plugin';
import { pageSchema } from './prosemirror-schema/page-schema';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  mySchema = pageSchema;
  view?: EditorView;
  pageNumber: number = 1;
  /**
   *
   */
  constructor() {}
  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  ngAfterViewInit(): void {
    const doc = schema.nodes.doc.create({
      content: [
        {
          type: 'page',
          attrs: { 'page-number': '1' },
          class: 'page',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is page 1.' }],
            },
          ],
        },
      ],
    });
    this.view = new EditorView(document.querySelector('#editor'), {
      state: EditorState.create({
        schema: this.mySchema,
        doc: doc,
        // doc: DOMParser.fromSchema(this.mySchema).parse(
        //   document.querySelector('#content') as Node
        // ),
        plugins: [...exampleSetup({ schema: this.mySchema }), pageBreakPlugin],
      }),
    });
  }

  insertNewPage() {
    if (!this.view) {
      return;
    }
    const { state, dispatch } = this.view;
    const { page: pageNode } = this.mySchema.nodes;

    // const { $from } = state.selection;
    // const index = $from.index();

    // if (!$from.parent.canReplaceWith(index, index, pageNode)) return false;

    if (dispatch) {
      this.pageNumber += 1;
      const newPage = pageNode.create({ 'page-number': this.pageNumber }, [
        this.mySchema.nodes['paragraph'].create(),
      ])!;
      const position = state.doc.content.size;
      const tr = state.tr.insert(position, newPage).scrollIntoView();
      dispatch(tr);
    }
    return true;
  }
}
