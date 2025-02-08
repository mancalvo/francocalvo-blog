import { SITE } from "@config";
import type { CollectionEntry } from "astro:content";

function postFilter<T extends 'blog' | 'blogEn'>({ data }: CollectionEntry<T>) {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
};

export default postFilter;
