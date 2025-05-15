import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { pageNodeSpec } from '../prosemirror-nodes/page';
import { Schema } from 'prosemirror-model';

const existingDocNodeSpec = { ...schema.spec.nodes.get('doc') };
existingDocNodeSpec.content = 'page+';
const pageSchemaNodes = addListNodes(
  schema.spec.nodes,
  'paragraph block*',
  'block'
)
  .addBefore('paragraph', 'page', pageNodeSpec)
  // updating doc content to page NodeSpec
  .update('doc', existingDocNodeSpec, 'doc');

export const pageSchema = new Schema({
  nodes: pageSchemaNodes,
  marks: schema.spec.marks,
});
