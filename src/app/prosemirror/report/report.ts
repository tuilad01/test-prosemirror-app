import { pageSchema } from '@app/prosemirror/schema/page-schema';
import { Node, Schema } from 'prosemirror-model';
import { Attr, updateDynamicValueAttr } from '../common/common';

export type ReportNode = 'doc' | 'header' | 'footer' | 'cover';

export class Report {
  doc?: Node | null;
  header?: Node | null;
  footer?: Node | null;
  cover?: Node | null;
  headerId?: string;
  footerId?: string;
  converId?: string;
  otherReports?: Node[];

  constructor(reportInit: {
    doc?: Node | null;
    header?: Node | null;
    footer?: Node | null;
    cover?: Node | null;
    headerId?: string;
    footerId?: string;
    converId?: string;
    otherReports?: Node[];
  }) {
    this.doc = reportInit.doc;
    this.header = reportInit.header;
    this.footer = reportInit.footer;
    this.cover = reportInit.cover;
    this.headerId = reportInit.headerId;
    this.footerId = reportInit.footerId;
    this.converId = reportInit.converId;
    this.otherReports = reportInit.otherReports;
  }

  updateDynamicValues(dynamicValues: Attr, targets?: ReportNode[]) {
    const properties: ReportNode[] = targets
      ? targets
      : ['doc', 'header', 'footer'];
    for (const property of properties) {
      let node = this[property];
      if (!node) {
        continue;
      }

      this[property] = updateDynamicValueAttr(node, dynamicValues);
    }
  }

  fromJSON(jsons: {raw: string, target: ReportNode}[], schema?: Schema) {
    for (const {raw, target} of jsons) {
      const node = Node.fromJSON(schema ?? pageSchema, raw);
      this[target] = node;
    }
  }

  toJSON() {
    return {
      doc: this.doc?.toJSON(),
      header: this.header?.toJSON(),
      footer: this.footer?.toJSON(),
      cover: this.cover?.toJSON(),
      headerId: this.headerId,
      footerId: this.footerId,
      converId: this.converId,
    };
  }
}
