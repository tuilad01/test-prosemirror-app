import {
  handleArrowLeftChecklistCommand,
  removeEmptyListItemAndInsertParagraph,
} from '@app/prosemirror-nodes/custom-list-item';
import { keymap } from 'prosemirror-keymap';
import { Transaction } from 'prosemirror-state';
import { ReplaceStep } from 'prosemirror-transform';
import { Node } from 'prosemirror-model';

export class TransactionType {
  type: 'UNKNOWN' | 'INSERT' | 'DELETE' | 'CLICK' | 'SELECT' = 'UNKNOWN';
  insertText?: string; // This only has if type = INSERT
}

export function isClickTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.steps.length === 0 &&
    transaction.selection.from === transaction.selection.to
  );
}
export function isSelectTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.steps.length === 0 &&
    transaction.selection.from !== transaction.selection.to
  );
}

export function isInsertTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.step.length > 0 &&
    transaction.steps[0] instanceof ReplaceStep &&
    transaction.steps[0].from === transaction.steps[0].to
  );
}
export function isDeleteTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.step.length > 0 &&
    transaction.steps[0] instanceof ReplaceStep &&
    transaction.steps[0].from < transaction.steps[0].to
  );
}

export function getInsertText(transaction: Transaction) {
  const step = transaction.steps[0] as ReplaceStep | undefined;
  return step?.slice.content.textBetween(0, step.slice.content.size) || '';
}

/**
 * - INSERT type could be PASTE
 * - DELETE type could be CUT
 * @param transaction
 * @returns
 */
export function getTransactionType(transaction: Transaction): TransactionType {
  if (!transaction.steps) {
    return { type: 'UNKNOWN' };
  }

  if (isClickTransaction(transaction)) {
    return { type: 'CLICK' };
  }

  if (isSelectTransaction(transaction)) {
    return { type: 'SELECT' };
  }

  if (isInsertTransaction(transaction)) {
    return { type: 'INSERT', insertText: getInsertText(transaction) };
  }

  if (isDeleteTransaction(transaction)) {
    return { type: 'DELETE' };
  }

  return { type: 'UNKNOWN' };
}

export interface TransactionDetail {
  page?: Node;
  pageStartOutsidePosition: number;
  pageEndOutsidePosition: number;
  pageStartInsidePosition: number;
  pageEndInsidePosition: number;
  nextPage?: Node;
  block?: Node;
  blockStartOutsidePosition: number;
  blockEndOutsidePosition: number;
  blockStartInsidePoistion: number;
  blockEndInsidePosition: number;
}

export function getTransactionDetail(
  transaction: Transaction
): TransactionDetail {
  const { selection } = transaction,
    { depth } = selection.$from;
  const pageDepth = 1;

  const page = selection.$from.node(pageDepth);
  const pageStartOutside = selection.$from.start(pageDepth); // first position at outside dom element
  const pageEndOutside = selection.$from.end(pageDepth); // last position at oside dom element
  const pageStartInside = selection.$from.before(pageDepth); // first position at inside dom element
  const pageEndInside = selection.$from.after(pageDepth); // last posistion at inside dom element

  const block = selection.$from.node(depth);
  const blockStartOutside = selection.$from.start(depth); // first position at outside dom element
  const blockEndOutside = selection.$from.end(depth); // last position at oside dom element
  const blockStartInside = selection.$from.before(depth); // first position at inside dom element
  const blockEndInside = selection.$from.after(depth); // last posistion at inside dom element

  const pageIndex = selection.$from.index(pageDepth);
  const nextPage =
    transaction.doc.children.length > pageIndex + 1
      ? transaction.doc.child(pageIndex + 1)
      : undefined;

  const detail: TransactionDetail = {
    page: page,
    pageStartOutsidePosition: pageStartOutside,
    pageEndOutsidePosition: pageEndOutside,
    pageStartInsidePosition: pageStartInside,
    pageEndInsidePosition: pageEndInside,
    nextPage: nextPage,
    block: block,
    blockStartOutsidePosition: blockStartOutside,
    blockEndOutsidePosition: blockEndOutside,
    blockStartInsidePoistion: blockStartInside,
    blockEndInsidePosition: blockEndInside,
  };

  // console.log(detail);
  return detail;
}

export const enterPlugin = keymap({
  Enter: removeEmptyListItemAndInsertParagraph,
  ArrowLeft: handleArrowLeftChecklistCommand,
});
