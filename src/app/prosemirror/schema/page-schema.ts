import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Fragment, Schema } from 'prosemirror-model';
import { Node } from 'prosemirror-model';
import { fontSizeMark } from '../marks/font-size-mark';
import { fontFamilyMark } from '../marks/font-family-mark';
import {
  imageBlockNodeName,
  imageBlockNodeSpec,
} from '@app/prosemirror/nodes/image-block';
import {
  customListNodeName,
  customListNodeSpec,
} from '@app/prosemirror/nodes/custom-list';
import {
  customListItemNodeName,
  customListItemNodeSpec,
} from '@app/prosemirror/nodes/custom-list-item';
import {
  tableEditing,
  columnResizing,
  tableNodes,
  fixTables,
} from '../../prosemirror/modules/table/index';
import { TableBorder } from '@pages/editor/commands/table';
import { dynamicValueNodeName, dynamicValueNodeSpec } from '@app/prosemirror/nodes/dynamic-value';

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
            const color = value ? value : 'white';

            attrs['style'] =
              (attrs['style'] || '') +
              `background-color: ${color}; background-clip: padding-box; border: 1px solid; outline: 1px solid black;`;
          },
        },
        border: {
          default: null,
          getFromDOM(dom) {
            if (dom.style.border === 'none') {
              return 'border: none; ';
            }

            let style = '';
            if (dom.style.borderTop === 'none') {
              style += TableBorder.top;
            }

            if (dom.style.borderRight === 'none') {
              style += TableBorder.right;
            }

            if (dom.style.borderBottom === 'none') {
              style += TableBorder.bottom;
            }

            if (dom.style.borderLeft === 'none') {
              style += TableBorder.left;
            }

            return style ? style : null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs['style'] = (attrs['style'] || '') + value.toString();
          },
        },
      },
    })
  )
  .addToEnd(dynamicValueNodeName, dynamicValueNodeSpec);
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
