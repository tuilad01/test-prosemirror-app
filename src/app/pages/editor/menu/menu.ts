import { EditorView } from 'prosemirror-view';

export class Menu {
  constructor(public items: MenuItem[] = []) {}

  add(item: MenuItem) {
    this.items.push(item);
  }

  remove(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

interface MenuItemOption {
  hidden?: boolean;
  shouldHide?: (view: EditorView) => boolean;
  shouldHideAsync?: (view: EditorView) => Promise<boolean>;
  disable?: boolean;
  shouldDisable?: (view: EditorView) => boolean;
  shouldDisableAsync?: (view: EditorView) => boolean;
}

export class MenuItem {
  constructor(
    public id: string,
    public label: string,
    public command: (view: EditorView) => void,
    public options?: MenuItemOption
  ) {}
}
