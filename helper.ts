import {
  CachedPlaylistData,
  RenderedPlaylistItem,
  YoutubePlaylistResponse,
} from "@/types.ts";
import { API_URL, playlistItemSelector } from "@/config.ts";
import { API_KEY } from "@/env.ts";

export const waitForElements = async <T extends Element>(
  selector: string,
  timeout: number = 10000,
): Promise<NodeListOf<T> | null> => {
  const browserListId = getListId(location.href);
  return await new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const elementList = document.querySelectorAll(selector);

      if (elementList.length === 0) return null;

      const elementListId = getListId(
        document
          .querySelectorAll(playlistItemSelector)
          [elementList.length - 1]?.querySelector("a")?.href,
      );

      if (browserListId !== elementListId) return null;

      observer.disconnect();
      clearTimeout(timer);
      resolve(elementList as NodeListOf<T>);
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(
          `Element with selector '${selector}' not found within ${timeout}ms`,
        ),
      );
    }, timeout);

    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export async function fetchJson<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fetch error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as Promise<T>;
}

export const getListId = (url: string | undefined) => {
  if (!url || url.length <= 0) return "";
  return new URL(url).searchParams.get("list") ?? "";
};

export const getVideoId = (url: string | undefined): string => {
  if (!url || url.length <= 0) return "";
  return new URL(url).searchParams.get("v") ?? "";
};

type storeCacheDataParam<T extends string> = T extends "playlistCache"
  ? YoutubePlaylistResponse
  : string[];

export const storeCache = <T extends "playlistCache" | "renderedCache">(
  storageKey: T,
  data: storeCacheDataParam<T>,
  playlistId: string,
) => {
  if (!data || !playlistId) return null;
  console.log("storeCache =>", playlistId);

  if (storageKey === "renderedCache") {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ ...getFullCache(storageKey), [playlistId]: data }),
    );
  } else if (storageKey === "playlistCache") {
    const playlistData = data as YoutubePlaylistResponse;
    const newItems = playlistData.items.reduce(
      (acc, item) => {
        acc[item.contentDetails.videoId] = {
          videoPublishedAt: item.contentDetails.videoPublishedAt,
        };

        return acc;
      },
      {} as CachedPlaylistData["items"],
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...getFullCache(storageKey),
        [playlistId]: {
          items: newItems,
          listId: playlistId,
          storeTime: Date.now(),
          extVersion: "0.0.0",
        },
      }),
    );
  }
};

type getCacheRT<T extends string> = T extends "playlistCache"
  ? CachedPlaylistData
  : string[];

export const getCache = <T extends "playlistCache" | "renderedCache">(
  storageKey: T,
  playlistId: string,
): getCacheRT<T> | null => {
  const data = localStorage.getItem(storageKey);
  if (!data || !playlistId) return null;
  return JSON.parse(data)[playlistId] as getCacheRT<T>;
};
export const comparePlaylist = (
  listA: string[] | null,
  listB: string[] | null,
): boolean => {
  if (!listA || !listB) return false;
  if (listA.length !== listB.length) return false;
  const listBsorted = listB.sort();
  return listA.sort().every((id, index) => id === listBsorted[index]);
};

type getFullCacheRT<T extends string> = T extends "playlistCache"
  ? { [key: string]: CachedPlaylistData }
  : { [key: string]: RenderedPlaylistItem[] };

export const getFullCache = <T extends "playlistCache" | "renderedCache">(
  storageKey: T,
): getFullCacheRT<T> | null => {
  const data = localStorage.getItem(storageKey);
  if (!data) return null;
  return JSON.parse(data) as getFullCacheRT<T>;
};

export const getPlaylistItemsUrl = (
  playlistId: string,
  apiKey: string,
  nextPageToken: string | null = null,
): string => {
  return `${API_URL}&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
};

// const checkVideoAvailability = async (
//   videoId: string,
// ): Promise<boolean | undefined> => {
//   const videoInfo = await videoAPI(videoId);
//   if (!videoInfo) return false;
//   if (!videoInfo.items[0].contentDetails.regionRestriction) return true;
//
//   const { country } = await fetchJson<countryIs>("https://api.country.is/");
//
//   return !videoInfo.items[0].contentDetails.regionRestriction?.blocked?.includes(
//     country,
//   );
// };
