export class PageManager {
  /**
   * Current page
   */
  page: Node | null = null;
  pageNumber: number = 0;
  pageStartPositionInside: number = 0;

  /**
   * Curent block
   */
  block: Node | null = null;
  blockIndex: number = -1;
  blockStartPositionInside: number = 0;
}
