import { Node } from 'prosemirror-model';
import { EditorView, NodeView, ViewMutationRecord } from 'prosemirror-view';
import { CellAttrs } from './util';
import { v4 as uuidv4 } from 'uuid';
/**
 * @public
 */
export class TableView implements NodeView {
  public dom: HTMLDivElement;
  public table: HTMLTableElement;
  public colgroup: HTMLTableColElement;
  public contentDOM: HTMLTableSectionElement;
  public input?: HTMLInputElement;
  public handleInputChange?: (e: Event) => void;
  public resizeObserver?: ResizeObserver;
  public mutationObserver?: MutationObserver;

  constructor(
    public node: Node,
    public defaultCellMinWidth: number,
    public view: EditorView
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'tableWrapper';
    this.table = this.dom.appendChild(document.createElement('table'));
    // const tableId = uuidv4();
    // this.table.setAttribute('data-formula-table-id', tableId);
    this.table.style.setProperty(
      '--default-cell-min-width',
      `${defaultCellMinWidth}px`
    );
    this.colgroup = this.table.appendChild(document.createElement('colgroup'));
    updateColumnsOnResize(node, this.colgroup, this.table, defaultCellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement('tbody'));

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'formula-table-input';
    this.input.style.position = 'fixed';
    this.input.contentEditable = 'false';

    const debounceSaveFormula = this.debounce(
      (value: string) => console.log(value),
      1000
    );
    this.handleInputChange = (e: Event) => {
      debounceSaveFormula((e.target as HTMLInputElement).value);
    };
    this.input.addEventListener('input', this.handleInputChange);
    // this.updateInputPosition = this.updateInputPosition.bind(this);
    // if (this.input) {
    //   requestAnimationFrame(() => {
    //     this.updateInputPosition();
    //   });
    // }

    document.body.appendChild(this.input);
    this.mutationObserver = new MutationObserver(() => {
      // console.log('MutationObserver run');

      this.updateInputPosition();
    });

    this.mutationObserver.observe(view.dom, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    this.updateInputPosition();

    window.addEventListener('scroll', () => {
      this.updateInputPosition();
    }, true)
  }

  updateInputPosition() {
    if (!this.input) {
      return;
    }
    requestAnimationFrame(() => {
      const tableRect = this.table.getBoundingClientRect();
      const tableWrapperRect = this.dom.getBoundingClientRect();
      // console.log('tableRect', tableRect);
      // console.log('tableWrapperRect', tableWrapperRect);
      // console.log('tableWrapperRect.top', tableWrapperRect.top);
      this.input!.style.top = tableWrapperRect.top + 'px';
      this.input!.style.left =
        tableRect.width < 743
          ? tableRect.right + 1 + 'px'
          : tableWrapperRect.right + 1 + 'px';
    });
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

  update(node: Node): boolean {
    if (node.type != this.node.type) return false;
    updateColumnsOnResize(
      node,
      this.colgroup,
      this.table,
      this.defaultCellMinWidth
    );
    this.updateInputPosition();
    return true;
  }

  ignoreMutation(record: ViewMutationRecord): boolean {
    return (
      record.type == 'attributes' &&
      (record.target == this.table || this.colgroup.contains(record.target))
    );
  }

  destroy() {
    console.log('destroy');
    if (this.mutationObserver) {
      // console.log('disconect mutationobserver');
      this.mutationObserver.disconnect();
    }
    if (this.input) {
      if (this.handleInputChange) {
        // console.log('remove event handleinputchange');

        this.input.removeEventListener('input', this.handleInputChange);
      }
      // console.log('remove input elemnet');
      this.input.remove();
    }
  }
}

/**
 * @public
 */
export function updateColumnsOnResize(
  node: Node,
  colgroup: HTMLTableColElement,
  table: HTMLTableElement,
  defaultCellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number,
  overrideNextCellWidth?: { width: number | null }
): void {
  let totalWidth = 0;
  let fixedWidth = true;
  let nextDOM = colgroup.firstChild as HTMLElement;
  const row = node.firstChild;
  if (!row) return;
  for (let i = 0, col = 0; i < row.childCount; i++) {
    const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
    for (let j = 0; j < colspan; j++, col++) {
      let hasWidth =
        overrideCol == col ? overrideValue : colwidth && colwidth[j];

      if (
        overrideCol !== undefined &&
        overrideCol + 1 === col &&
        overrideNextCellWidth?.width
      ) {
        hasWidth = overrideNextCellWidth.width;
      }
      const cssWidth = hasWidth ? hasWidth + 'px' : '';
      totalWidth += hasWidth || defaultCellMinWidth;
      if (!hasWidth) fixedWidth = false;
      if (!nextDOM) {
        const col = document.createElement('col');
        col.style.width = cssWidth;
        colgroup.appendChild(col);
      } else {
        if (nextDOM.style.width != cssWidth) {
          nextDOM.style.width = cssWidth;
        }
        nextDOM = nextDOM.nextSibling as HTMLElement;
      }
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling;
    nextDOM.parentNode?.removeChild(nextDOM);
    nextDOM = after as HTMLElement;
  }

  if (fixedWidth) {
    table.style.width = totalWidth + 'px';
    table.style.minWidth = '';
  } else {
    table.style.width = '';
    table.style.minWidth = totalWidth + 'px';
  }
}
