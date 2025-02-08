import type { CollectionEntry } from "astro:content";

type GroupKey = string | number | symbol;

interface GroupFunction<T> {
  (item: T, index?: number): GroupKey;
}

function getPostsByGroupCondition  <T extends 'blog' | 'blogEn'>(
  posts: CollectionEntry<T>[],
  groupFunction: GroupFunction<CollectionEntry<T>>
) {
  const result: Record<GroupKey, CollectionEntry<T>[]> = {};
  for (let i = 0; i < posts.length; i++) {
    const item = posts[i];
    const groupKey = groupFunction(item, i);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
  }
  return result;
};

export default getPostsByGroupCondition;
