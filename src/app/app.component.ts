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
import { Node } from 'prosemirror-model';
@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  exportJSon() {
    console.log(this.view?.state.doc.toJSON());
  }
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
    const doc = Node.fromJSON(this.mySchema, {
      type: 'doc',
      content: [
        {
          type: 'page',
          attrs: { 'page-number': '1' },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam blandit arcu ut odio iaculis, eu facilisis massa varius. Praesent dolor nibh, laoreet ac nisi id, placerat gravida justo. Quisque ac felis dictum nulla ornare posuere. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque pretium lacinia justo quis hendrerit. Phasellus tortor risus, dapibus sed nunc ut, lacinia lobortis turpis. Praesent porttitor leo at libero dapibus auctor. Sed ac molestie tellus. Etiam ultrices magna quis pulvinar blandit. Phasellus bibendum consequat tincidunt. Quisque sed sem sed lacus volutpat placerat. Sed nisi lacus, aliquet ac lobortis ut, iaculis quis ipsum. Nam sagittis tortor sit amet scelerisque vulputate. Aenean mollis et enim at ultricies. Etiam ac sollicitudin elit, eget sollicitudin ligula. Integer id urna vehicula, cursus mauris sit amet, tristique lacus. Nunc faucibus ex nec enim dapibus vehicula. Nunc at leo laoreet, pharetra lacus ut, ultricies urna. Cras vitae finibus tellus. Praesent quis nunc id purus gravida tempor. Fusce ac felis venenatis, luctus arcu elementum, tempor neque. Nullam ut erat id purus tincidunt dictum. Curabitur imperdiet vel augue nec ornare. In hac habitasse platea dictumst. Proin pulvinar augue sapien, eget porttitor tellus pharetra ac. Nam sit amet nunc et lectus sodales dictum non ut leo. Maecenas vestibulum justo nec lacinia rutrum. Maecenas in fermentum lectus, sed aliquam ipsum. Aliquam interdum sollicitudin mi, vel placerat magna commodo et. Nunc sit amet est mauris. Nam accumsan ullamcorper tortor et mollis. Nunc accumsan est nec varius pulvinar. Vivamus feugiat volutpat tortor non volutpat. Mauris et felis in justo porttitor maximus faucibus sed enim. Etiam imperdiet sed turpis et vulputate. Morbi posuere ex nec dui vulputate, sed consequat felis venenatis. Duis consectetur sodales arcu. Pellentesque laoreet malesuada nunc nec rutrum. Suspendisse tincidunt sed nunc vitae varius. Ut pellentesque ipsum ac pulvinar porttitor. Duis et elit a odio auctor venenatis. Curabitur sit amet leo et magna fermentum accumsan. Pellentesque interdum hendrerit ex et vulputate. Suspendisse condimentum aliquet mi at placerat. Aliquam dapibus magna ut urna euismod, congue condimentum nibh scelerisque. Nam iaculis lobortis nisi, nec facilisis lorem rhoncus nec. Aenean blandit lorem in auctor egestas. In vehicula, lorem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Maecenas risus nisl, aliquet id mi eu, iaculis mattis ante. Aliquam nec tincidunt felis, vitae venenatis ligula. Integer eleifend, justo ac mattis sagittis, tortor lorem ornare nibh, at tempor enim nisi vitae diam. Praesent venenatis commodo orci a tristique. Nulla ex nibh, laoreet ut quam quis, rhoncus faucibus magna.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam blandit arcu ut odio iaculis, eu facilisis massa varius. Praesent dolor nibh, laoreet ac nisi id, placerat gravida justo. Quisque ac felis dictum nulla ornare posuere. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque pretium lacinia justo quis hendrerit. Phasellus tortor risus, dapibus sed nunc ut, lacinia lobortis turpis. Praesent porttitor leo at libero dapibus auctor. Sed ac molestie tellus. Etiam ultrices magna quis pulvinar blandit. Phasellus bibendum consequat tincidunt. Quisque sed sem sed lacus volutpat placerat. Sed nisi lacus, aliquet ac lobortis ut, iaculis quis ipsum. Nam sagittis tortor sit amet scelerisque vulputate. Aenean mollis et enim at ultricies. Etiam ac sollicitudin elit, eget sollicitudin ligula. Integer id urna vehicula, cursus mauris sit amet, tristique lacus. Nunc faucibus ex nec enim dapibus vehicula. Nunc at leo laoreet, pharetra lacus ut, ultricies urna. Cras vitae finibus tellus. Praesent quis nunc id purus gravida tempor. Fusce ac felis venenatis, luctus arcu elementum, tempor neque. Nullam ut erat id purus tincidunt dictum. Curabitur imperdiet vel augue nec ornare. In hac habitasse platea dictumst. Proin pulvinar augue sapien, eget porttitor tellus pharetra ac. Nam sit amet nunc et lectus sodales dictum non ut leo. Maecenas vestibulum justo nec lacinia rutrum. Maecenas in fermentum lectus, sed aliquam ipsum. Aliquam interdum sollicitudin mi, vel placerat magna commodo et. Nunc sit amet est mauris. Nam accumsan ullamcorper tortor et mollis. Nunc accumsan est nec varius pulvinar. Vivamus feugiat volutpat tortor non volutpat. Mauris et felis in justo porttitor maximus faucibus sed enim. Etiam imperdiet sed turpis et vulputate. Morbi posuere ex nec dui vulputate, sed consequat felis venenatis. Duis consectetur sodales arcu. Pellentesque laoreet malesuada nunc nec rutrum. Suspendisse tincidunt sed nunc vitae varius. Ut pellentesque ipsum ac pulvinar porttitor. Duis et elit a odio auctor venenatis. Curabitur sit amet leo et magna fermentum accumsan. Pellentesque interdum hendrerit ex et vulputate. Suspendisse condimentum aliquet mi at placerat. Aliquam dapibus magna ut urna euismod, congue condimentum nibh scelerisque. Nam iaculis lobortis nisi, nec facilisis lorem rhoncus nec. Aenean blandit lorem in auctor egestas. In vehicula, lorem ac tempus lacinia, velit mauris dignissim odio, venenatis faucibus eros lorem accumsan mauris. Maecenas risus nisl, aliquet id mi eu, iaculis mattis ante. Aliquam nec tincidunt felis, vitae venenatis ligula. Integer eleifend, justo ac mattis sagittis, tortor lorem ornare nibh, at tempor enim nisi vitae diam. Praesent venenatis commodo orci a tristique. Nulla ex nibh, laoreet ut quam quis, rhoncus faucibus magna.',
                },
              ],
            },
          ],
        },
        {
          type: 'page',
          attrs: { 'page-number': '2' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'page 2' }],
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
        plugins: [
          ...exampleSetup({ schema: this.mySchema }),
          pageBreakPlugin(this.view),
        ],
      }),
    });

    document.addEventListener('click', (event) => {
      console.log(event.target);

      console.log(
        'posAtDOM: ',
        this.view?.posAtDOM(event.target as any, 0, -1)
      );
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
