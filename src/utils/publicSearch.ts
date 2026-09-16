export function normalizeSearchText(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    : '';
}

export function searchableBlockText(block: Record<string, unknown>): string {
  const values: string[] = [
    typeof block.title === 'string' ? block.title : '',
    typeof block.subtitle === 'string' ? block.subtitle : '',
    typeof block.description === 'string' ? block.description : ''
  ];
  if (block.type === 'folder' && Array.isArray(block.items)) {
    block.items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const entry = item as Record<string, unknown>;
      values.push(typeof entry.title === 'string' ? entry.title : '', typeof entry.subtitle === 'string' ? entry.subtitle : '');
    });
  }
  if (block.type === 'faq' && Array.isArray(block.items)) {
    block.items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const entry = item as Record<string, unknown>;
      values.push(typeof entry.question === 'string' ? entry.question : '', typeof entry.answer === 'string' ? entry.answer : '');
    });
  }
  return normalizeSearchText(values.join(' '));
}

export function matchesPublicPageSearch(block: Record<string, unknown>, query: unknown): boolean {
  const normalizedQuery = normalizeSearchText(query);
  return !normalizedQuery || searchableBlockText(block).includes(normalizedQuery);
}
