import { Component, OnInit } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-drag-drop',
  imports: [CdkDropList, CdkDrag, CdkDragHandle, ButtonModule],
  templateUrl: './drag-drop.component.html',
  styleUrl: './drag-drop.component.css',
})
export class DragDropComponent implements OnInit {
  items = [
    { id: '1', name: 'Item One' },
    { id: '2', name: 'Item Two' },
    { id: '3', name: 'Item Three' },
    { id: '4', name: 'Item Four' },
  ];
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      console.log(params, 'params');
      const orderIds = params['attachments']?.split(',');
      if (!orderIds) {
        return;
      }

      this.items.sort(
        (a, b) => orderIds.indexOf(a.id) - orderIds.indexOf(b.id)
      );
    });
  }

  drop(
    event: CdkDragDrop<
      {
        id: number;
        name: string;
      }[]
    >
  ) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { attachments: this.items.map(({ id }) => id).join(',') },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  goToPreview() {
    this.router.navigate(['/preview']);
  }
}
