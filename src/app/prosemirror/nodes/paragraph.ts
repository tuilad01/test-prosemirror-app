import { pageSchema } from '../schema/page-schema';

export function createParagraph(text: string) {
  return pageSchema.nodes['paragraph'].create(null, pageSchema.text(text));
}
