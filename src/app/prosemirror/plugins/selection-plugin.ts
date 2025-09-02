import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

// Create a custom plugin that checks for page overflow after each transaction
export function selectionPlugin(view: EditorView | undefined) {
  return new Plugin({
    view(view) {
      return new SelectionSizeTooltip(view);
    },
  });
}

class SelectionSizeTooltip {
  tooltip!: HTMLElement;
  constructor(view: EditorView) {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    if (!view.dom.parentElement) {
      console.error('ERROR. parentElement not found.');
      return;
    }

    view.dom.parentNode!.appendChild(this.tooltip);

    this.update(view, null);
  }

  update(view: EditorView, lastState: EditorState | null) {
    let state = view.state;
    // Don't do anything if the document/selection didn't change
    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    )
      return;

    // Hide the tooltip if the selection is empty
    if (state.selection.empty) {
      this.tooltip.style.display = 'none';
      return;
    }

    // Otherwise, reposition it and update its content
    this.tooltip.style.display = '';
    let { from, to } = state.selection;
    // These are in screen coordinates
    let start = view.coordsAtPos(from),
      end = view.coordsAtPos(to);
    // The box in which the tooltip is positioned, to use as base
    let box = this.tooltip.offsetParent!.getBoundingClientRect();
    // Find a center-ish x position from the selection endpoints (when
    // crossing lines, end may be more to the left)
    let left = Math.max((start.left + end.left) / 2, start.left + 3);
    this.tooltip.style.left = left - box.left + 'px';
    this.tooltip.style.bottom = box.bottom - start.top + 'px';
    this.tooltip.textContent = `${to - from}`;
  }

  destroy() {
    this.tooltip.remove();
  }
}
