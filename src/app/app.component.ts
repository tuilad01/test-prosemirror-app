import {
  AfterViewInit,
  Component,
  effect,
  model,
  ModelSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditorState,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, NodeSpec, Mark } from 'prosemirror-model';
import { marks, schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { pageBreakPlugin } from './prosemirror/plugins/page-break-plugin';
import { createPage, pageSchema } from './prosemirror/schema/page-schema';
import { Node } from 'prosemirror-model';
import {
  pageBreakPlugin2,
  repaginate,
  repaginate2,
} from './prosemirror/plugins/page-break-plugin2';
import {
  canJoin,
  MapResult,
  ReplaceStep,
  StepMap,
} from 'prosemirror-transform';
import { createParagraph } from './prosemirror/nodes/paragraph';
import { toggleMark } from 'prosemirror-commands';
import { fontSizeMark } from './prosemirror/marks/font-size-mark';
import { selectionPlugin } from './prosemirror/plugins/selection-plugin';
import { RouterOutlet } from '@angular/router';
import { EditorComponent } from '@pages/editor/editor.component';
class TransactionType {
  type: 'UNKNOWN' | 'INSERT' | 'DELETE' | 'CLICK' | 'SELECT' = 'UNKNOWN';
  insertText?: string; // This only has if type = INSERT
}

function isClickTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.steps.length === 0 &&
    transaction.selection.from === transaction.selection.to
  );
}
function isSelectTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.steps.length === 0 &&
    transaction.selection.from !== transaction.selection.to
  );
}

function isInsertTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.step.length > 0 &&
    transaction.steps[0] instanceof ReplaceStep &&
    transaction.steps[0].from === transaction.steps[0].to
  );
}
function isDeleteTransaction(transaction: Transaction) {
  return (
    transaction.steps &&
    transaction.step.length > 0 &&
    transaction.steps[0] instanceof ReplaceStep &&
    transaction.steps[0].from < transaction.steps[0].to
  );
}

function getInsertText(transaction: Transaction) {
  const step = transaction.steps[0] as ReplaceStep | undefined;
  return step?.slice.content.textBetween(0, step.slice.content.size) || '';
}

/**
 * - INSERT type could be PASTE
 * - DELETE type could be CUT
 * @param transaction
 * @returns
 */
function getTransactionType(transaction: Transaction): TransactionType {
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

interface TransactionDetail {
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

function getTransactionDetail(transaction: Transaction): TransactionDetail {
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

@Component({
  selector: 'app-root',
  imports: [FormsModule, EditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
