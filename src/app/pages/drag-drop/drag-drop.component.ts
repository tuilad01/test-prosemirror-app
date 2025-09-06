import { Component } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-drag-drop',
  imports: [CdkDropList, CdkDrag, CdkDragHandle, ButtonModule],
  templateUrl: './drag-drop.component.html',
  styleUrl: './drag-drop.component.css',
})
export class DragDropComponent {
  items = [
    { id: 1, name: 'Item One' },
    { id: 2, name: 'Item Two' },
    { id: 3, name: 'Item Three' },
    { id: 4, name: 'Item Four' },
  ];
  drop(
    event: CdkDragDrop<
      {
        id: number;
        name: string;
      }[]
    >
  ) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    console.log(this.items);
  }
}
