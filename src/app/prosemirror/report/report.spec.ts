import { Schema, Node } from 'prosemirror-model';
import { pageSchema } from '@app/prosemirror/schema/page-schema';
import { Report } from './report';
describe('Report', () => {
  let schema: Schema;

  beforeAll(() => {
    schema = pageSchema;
  });

  it('should initialize with empty constructor', () => {
    const report = new Report();
    expect(report.doc).toBeUndefined();
    expect(report.header).toBeUndefined();
    expect(report.footer).toBeUndefined();
  });

  it('should initialize with provided values', () => {
    const doc = schema.nodes['doc'].createAndFill();
    const header = schema.nodes['paragraph'].createAndFill();
    const footer = schema.nodes['paragraph'].createAndFill();

    const report = new Report({
      doc,
      header,
      footer,
      headerId: 'h1',
      footerId: 'f1',
      converId: 'c1',
    });

    expect(report.doc).toBeDefined();
    expect(report.header).toBeDefined();
    expect(report.footer).toBeDefined();
    expect(report.headerId).toBeDefined();
    expect(report.footerId).toBeDefined();
    expect(report.converId).toBeDefined();
  });

  // it('should update attributes of matching node type', () => {
  //   const { dynamic_value } = schema.nodes;
  //   const dynamicValueNode = dynamic_value.create({
  //     key: 'old',
  //     value: 'keep',
  //   });
  //   const report = new Report({ doc: dynamicValueNode });

  //   const updated = report.updateAttrs(dynamicValueNode, dynamic_value.name, {
  //     key: 'new',
  //   });

  //   expect(updated.attrs['key']).toBe('new');
  // });

  // it('should not change node if type does not match', () => {
  //   const { dynamic_value } = schema.nodes;
  //   const dynamicValueNode = dynamic_value.create({
  //     key: 'old',
  //     value: 'keep',
  //   });
  //   const report = new Report({ doc: dynamicValueNode });

  //   const updated = report.updateDynamicValues(dynamicValueNode, 'paragraph', {
  //     key: 'new',
  //   });

  //   expect(updated.attrs['key']).toBe('old');
  // });

  it('should set doc/header/footer from JSON', () => {
    const report = new Report();

    const jsonDoc = schema.nodes['doc'].createAndFill()?.toJSON()!;
    report.fromJSON(jsonDoc, 'doc', schema);

    expect(report.doc).toBeInstanceOf(Node);
    expect(report.doc?.type.name).toBe('doc');
  });

  it('should serialize to JSON', () => {
    const doc = schema.nodes['doc'].createAndFill();
    const header = schema.nodes['paragraph'].createAndFill();
    const footer = schema.nodes['paragraph'].createAndFill();

    const report = new Report({ doc, header, footer });

    const json = report.toJSON();

    expect(json.doc).toEqual(doc?.toJSON());
    expect(json.header).toEqual(header?.toJSON());
    expect(json.footer).toEqual(footer?.toJSON());
  });
  it('should change node attributes of dynamic value', () => {
    const { dynamic_value } = schema.nodes;

    const dynamicValueNode = dynamic_value.create({
      key: '1',
      value: 'value 1',
    });
    const dynamicValueNode2 = dynamic_value.create({
      key: '2',
      value: 'value 2',
    });
    const dynamicValueNode3 = dynamic_value.create({
      key: '3',
      value: 'value 3',
    });
   
    const report = new Report({ doc: dynamicValueNode, header: dynamicValueNode2, footer: dynamicValueNode3 });

    report.updateDynamicValues({
      '1': 'value 11',
      '2': 'value 22',
      '3': 'value 33',
    });

    expect(report.doc?.attrs['value']).toBe('value 11');
    expect(report.header?.attrs['value']).toBe('value 22');
    expect(report.footer?.attrs['value']).toBe('value 33');
  });
});
