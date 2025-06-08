import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { pageNodeSpec } from '../prosemirror-nodes/page';
import { Fragment, Schema } from 'prosemirror-model';
import { headerNodeSpec } from '../prosemirror-nodes/page-header';
import { contentNodeSpec } from '../prosemirror-nodes/page-content';
import { footerNodeSpec } from '../prosemirror-nodes/page-footer';
import { Node } from 'prosemirror-model';
import { fontSizeMark } from '../prosemirror-marks/font-size-mark';
import { fontFamilyMark } from '../prosemirror-marks/font-family-mark';

const existingDocNodeSpec = { ...schema.spec.nodes.get('doc') };
existingDocNodeSpec.content = 'page+';
const pageSchemaNodes = addListNodes(
  schema.spec.nodes,
  'paragraph block*',
  'block'
)
  .addBefore('paragraph', 'page', pageNodeSpec)
  .addBefore('paragraph', 'pageHeader', headerNodeSpec)
  .addBefore('paragraph', 'pageContent', contentNodeSpec)
  .addBefore('paragraph', 'pageFooter', footerNodeSpec)
  // updating doc content to page NodeSpec
  .update('doc', existingDocNodeSpec, 'doc');

export const pageSchema = new Schema({
  nodes: pageSchemaNodes,
  marks: schema.spec.marks
    .addToEnd('fontFamily', fontFamilyMark)
    .addToEnd('fontSize', fontSizeMark),
});

export function createPage(blocks: Node[], pageNumber: number) {
  return pageSchema.nodes['page'].create({ 'page-number': pageNumber }, [
    createPageHeader(),
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
