import { Schema } from 'prosemirror-model';

export const NodeName = {
  Table: 'table',
  TableRow: 'table_row',
  TableCell: 'table_cell',
  Paragraph: 'paragraph',
};

export class SchemaNode {
  constructor(public schema: Schema) {}

  get table() {
    return this.schema.nodes[NodeName.Table];
  }

  get tableRow() {
    return this.schema.nodes[NodeName.TableRow];
  }

  get tableCell() {
    return this.schema.nodes[NodeName.TableCell];
  }

  get paragraph() {
    return this.schema.nodes[NodeName.Paragraph];
  }
}
