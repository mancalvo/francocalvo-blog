import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";

function getSortedPosts<T extends 'blog' | 'blogEn'>(posts: CollectionEntry<T>[]) {
  return posts
    .filter(postFilter)
    .sort(
      (a, b) =>
        Math.floor(
          new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
        ) -
        Math.floor(
          new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
        )
    );
};

export default getSortedPosts;
