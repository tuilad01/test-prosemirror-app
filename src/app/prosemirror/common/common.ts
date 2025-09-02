import { Node } from 'prosemirror-model';
import { Transform } from 'prosemirror-transform';
import { dynamicValueNodeName } from '../nodes/dynamic-value';

export type Attr = {
    [key: string]: any
}

export function updateAttrs(node: Node, nodeName: string, updatedAttrs: Attr) {
  const tr = new Transform(node);
  if (node.type.name === nodeName) {
    for (const key in updatedAttrs) {
      tr.setDocAttribute(key, updatedAttrs[key]);
    }
  }

  tr.doc.descendants((node, pos) => {
    if (node.type.name !== nodeName) {
      return true;
    }

    tr.setNodeMarkup(pos, null, { ...node.attrs, ...updatedAttrs });
    return true;
  });

  return tr.doc;
}

export function updateDynamicValueAttr(node: Node, dynamicValues: Attr) {
  const tr = new Transform(node);
  if (node.type.name === dynamicValueNodeName) {
    const {key} = node.attrs;
    const value = dynamicValues[key] ?? null;
    tr.setDocAttribute('value', value);
  }

  tr.doc.descendants((node, pos) => {
    if (node.type.name !== dynamicValueNodeName) {
      return true;
    }
    const {key} = node.attrs;
    let value = dynamicValues[key] ?? null;
    tr.setNodeMarkup(pos, null, {...node.attrs, value: value});
    return true;
  });

  return tr.doc;
}