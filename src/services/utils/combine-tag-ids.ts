export function combineTagIds({
  tagIds,
}: {
  tagIds?: string[];
}): string[] | undefined {
  if (tagIds && Array.isArray(tagIds)) {
    return tagIds;
  }
  return [];
}
