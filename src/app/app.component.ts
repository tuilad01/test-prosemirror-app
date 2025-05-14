import { AfterViewInit, Component } from '@angular/core';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageNodeSpec } from './prosemirror-nodes/page';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  mySchema?: Schema;
  view?: EditorView;
  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  ngAfterViewInit(): void {
    const existingDocNodeSpec = { ...schema.spec.nodes.get('doc') };
    existingDocNodeSpec.content = 'page+';
    let _schema = addListNodes(schema.spec.nodes, 'paragraph block*', 'block')
      .addBefore('paragraph', 'page', pageNodeSpec)
      // updating doc content to page NodeSpec
      .update('doc', existingDocNodeSpec, 'doc');

    this.mySchema = new Schema({
      nodes: _schema,
      marks: schema.spec.marks,
    });
    const doc = schema.nodes.doc.create({
      content: [
        {
          type: 'page',
          attrs: { 'page-number': '1' },
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
        // schema: this.mySchema,
        // doc: doc,
        doc: DOMParser.fromSchema(this.mySchema).parse(
          document.querySelector('#content') as Node
        ),
        plugins: exampleSetup({ schema: this.mySchema }),
      }),
    });
  }
}
