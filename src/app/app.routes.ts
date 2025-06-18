import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
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
