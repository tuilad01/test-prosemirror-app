import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@pages/drag-drop/drag-drop.component').then(
        (component) => component.DragDropComponent
      ),
  },
  {
    path: 'editor-page',
    loadComponent: () =>
      import('@pages/editor/editor.component').then(
        (component) => component.EditorComponent
      ),
  },
  {
    path: 'editor/:id',
    loadComponent: () =>
      import('@pages/editor/editor.component').then(
        (component) => component.EditorComponent
      ),
  },
  {
    path: 'editor/create',
    loadComponent: () =>
      import('@pages/editor/editor.component').then(
        (component) => component.EditorComponent
      ),
  },
];
