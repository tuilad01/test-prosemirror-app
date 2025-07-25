import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Fragment, Schema } from 'prosemirror-model';
import { Node } from 'prosemirror-model';
import { fontSizeMark } from '../prosemirror-marks/font-size-mark';
import { fontFamilyMark } from '../prosemirror-marks/font-family-mark';
import {
  imageBlockNodeName,
  imageBlockNodeSpec,
} from '@app/prosemirror-nodes/image-block';
import {
  customListNodeName,
  customListNodeSpec,
} from '@app/prosemirror-nodes/custom-list';
import {
  customListItemNodeName,
  customListItemNodeSpec,
} from '@app/prosemirror-nodes/custom-list-item';
import {
  tableEditing,
  columnResizing,
  tableNodes,
  fixTables,
} from 'prosemirror-tables';

const existingDocNodeSpec = { ...schema.spec.nodes.get('doc') };
existingDocNodeSpec.content = 'page+';
const pageSchemaNodes = addListNodes(
  schema.spec.nodes,
  'paragraph block*',
  'block'
)
  //.addBefore('paragraph', 'page', pageNodeSpec)
  .addToEnd(imageBlockNodeName, imageBlockNodeSpec)
  .addToEnd(customListNodeName, customListNodeSpec)
  .addToEnd(customListItemNodeName, customListItemNodeSpec)
  .append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs['style'] =
                (attrs['style'] || '') + `background-color: ${value};`;
          },
        },
      },
    })
  );
//.addBefore('paragraph', headerNodeName, headerNodeSpec)
//.addBefore('paragraph', 'pageContent', contentNodeSpec)
//.addBefore('paragraph', 'pageFooter', footerNodeSpec)
//.addBefore('paragraph', editableHeaderNodeName, editableHeaderNode);
//.update('image', customImageNode)
// updating doc content to page NodeSpec
//.update('doc', existingDocNodeSpec, 'doc');

export const pageSchema = new Schema({
  nodes: pageSchemaNodes,
  marks: schema.spec.marks
    .addToEnd('fontFamily', fontFamilyMark)
    .addToEnd('fontSize', fontSizeMark),
});

export function createPage(blocks: Node[], pageNumber: number) {
  return pageSchema.nodes['page'].create({ 'page-number': pageNumber }, [
    // createPageHeader(),
    createPageContent(blocks),
    createPageFooter(`page ${pageNumber}`),
  ]);
}
export function createPageHeader() {
  return pageSchema.nodes['pageHeader'].create(null);
}

export function createPageContent(blocks: Node[]) {
  return pageSchema.nodes['pageContent'].create(
    null,
    Fragment.fromArray(blocks)
  );
}

export function createPageFooter(text: string) {
  return pageSchema.nodes['pageFooter'].create(null, [pageSchema.text(text)]);
}
