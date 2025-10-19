import { Command, EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
let scale = 1;
export function zoomIn() {
  const editorContent = document.querySelector('#editor')?.firstChild as
    | HTMLDivElement
    | null
    | undefined;
  if (!editorContent) {
    return false;
  }
  scale += 0.25;
  //   if (scale !== 1 && editorContent.parentElement) {
  //     editorContent.parentElement.style.justifyContent = 'flex-start';
  //   }
  editorContent.style.transform = `scale(${scale}) translateX(-25%) translateY(-25%)`;
  editorContent.style.transformOrigin = 'center';
  return false;
}

export function zoomIn2() {
  const editor = document.getElementById('editor');
  // prefer firstElementChild (only element nodes)
  const editorContent = editor?.firstElementChild as HTMLDivElement | null;
  if (!editorContent) return false;

  // change step and clamp as you like
  scale = Math.min(4, scale + 0.25);

  // scale from center
  editorContent.style.transformOrigin = 'center center';

  // compute the translate percent that compensates half of the extra size
  // (for scale=2 => translatePercent = 50)
  const translatePercent = ((scale - 1) / 2) * 100;

  // IMPORTANT: notice the correct syntax: scale(...) ) then translate(...) ...
  editorContent.style.transform = `scale(${scale}) translate(-${translatePercent}%, -${translatePercent}%)`;

  return false; // if you're using this from a form/button handler
}
export function zoomOut() {
  const editorContent = document.querySelector('#editor')?.firstChild as
    | HTMLDivElement
    | null
    | undefined;
  if (!editorContent) {
    return false;
  }
  scale -= 0.25;
  //   if (scale !== 1 && editorContent.parentElement) {
  //     editorContent.parentElement.style.justifyContent = 'flex-start';
  //   }
  editorContent.style.transform = `scale(${scale}) translateX(-25%) translateY(-25%)`;
  editorContent.style.transformOrigin = 'center';
  return false;
}
