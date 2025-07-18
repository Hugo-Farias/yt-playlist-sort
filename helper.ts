import {
  ApiCache,
  RenderedPlaylistItem,
  YoutubePlaylistResponse,
} from "@/types.ts";
import { API_URL, playlistItemSelector } from "@/config.ts";

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

export const getListId = (url: string | undefined): string => {
  if (!url || url.length <= 0) return "";
  return new URL(url).searchParams.get("list") ?? "";
};

export const getVideoId = (url: string | undefined): string => {
  if (!url || url.length <= 0) return "";
  return new URL(url).searchParams.get("v") ?? "";
};

type storeCacheDataParam<T extends string> = T extends "apiCache"
  ? YoutubePlaylistResponse
  : string[];

export const storeCache = <T extends "apiCache" | "renderedCache">(
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
  } else if (storageKey === "apiCache") {
    const playlistData = data as YoutubePlaylistResponse;
    const newItems = playlistData.items.reduce(
      (acc, item) => {
        acc[item.contentDetails.videoId] = {
          videoPublishedAt: new Date(
            item.contentDetails.videoPublishedAt,
          ).getTime(),
        };

        return acc;
      },
      {} as ApiCache["items"],
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

type getCacheRT<T extends string> = T extends "apiCache" ? ApiCache : string[];

// Get a specific cache entry by playlist ID
export const getCache = <T extends "apiCache" | "renderedCache">(
  storageKey: T,
  playlistId: string,
): getCacheRT<T> | null => {
  const data = localStorage.getItem(storageKey);
  if (!data || !playlistId) return null;
  return JSON.parse(data)[playlistId] as getCacheRT<T>;
};

// Compare two playlists by their video IDs returning true if they are identical
export const comparePlaylist = (
  listA: string[] | null,
  listB: string[] | null,
): boolean => {
  if (!listA || !listB) return false;
  if (listA.length !== listB.length) return false;
  const listBsorted = listB.sort();
  return listA.sort().every((id, index) => id === listBsorted[index]);
};

type getFullCacheRT<T extends string> = T extends "apiCache"
  ? { [key: string]: ApiCache }
  : { [key: string]: RenderedPlaylistItem[] };

export const getFullCache = <T extends "apiCache" | "renderedCache">(
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

// Format the date to a human-readable format
export function formatDate(
  dateInput: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
  locale = "en-CA",
): string {
  const date = new Date(dateInput);
  return date.toLocaleDateString(locale, options);
}
