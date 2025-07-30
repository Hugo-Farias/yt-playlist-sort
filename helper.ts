import {
  ApiCache,
  RenderedPlaylistItem,
  YoutubePlaylistResponse,
} from "@/types.ts";
import { API_URL, playlistItemSelector } from "@/config.ts";
import pkg from "@/package.json";

export const waitForElements = async <T extends Element>(
  selector: string,
  timeout: number = 10000,
  urlCheck: string = "",
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
      if (location.href === urlCheck) return null;

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

export const getVideoId = (url: string | undefined | Element): string => {
  if (url instanceof Element) {
    url = url.querySelector("a")?.href;
  }
  if (!url || url.length <= 0) return "";
  return new URL(url).searchParams.get("v") ?? "";
};

type storeCacheDataParam<T extends string> = T extends "apiCache"
  ? YoutubePlaylistResponse
  : string[];

export const storeCache = <T extends "apiCache" | "renderedCache">(
  storageKey: T,
  data: storeCacheDataParam<T> | null,
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
      (acc, item, index) => {
        acc[item.contentDetails.videoId] = {
          originalIndex: index,
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
          extVersion: pkg.version,
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
  idList: string[] | null,
): boolean => {
  if (!listA || !idList) return false;
  if (!listA.length || !idList.length) return false;
  if (listA.length !== idList.length) return false;
  const listBsorted = idList.sort();
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

// Format the date to a human-readable format
const formatDate = (
  dateInput: Date | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale = "en-US",
): string => {
  const date = new Date(dateInput);
  return date.toLocaleDateString(locale, options);
};

export const renderDateToElement = (el: HTMLDivElement, cache: ApiCache) => {
  const dateEl = el.querySelector(".playlistSort-date");
  if (dateEl) dateEl.remove();

  const itemEl = el.querySelector("#byline-container");
  if (!itemEl) return null;

  const videoPublishedAt = getDateFromCache(el, cache);

  const formattedDate = formatDate(videoPublishedAt);

  const span = document.createElement("span");
  span.textContent = `- ${formattedDate}`;
  span.classList.add(
    "style-scope",
    "ytd-playlist-panel-video-renderer",
    "playlistSort-date",
  );
  span.id = "byline";
  span.style.marginLeft = "-5px";

  itemEl.appendChild(span);
};

const getDateFromCache = (el: HTMLDivElement, cache: ApiCache) => {
  const videoId = getVideoId(el);
  return cache.items[videoId ?? ""]?.videoPublishedAt ?? Infinity;
};

const isSorted = (
  nodes: NodeListOf<HTMLDivElement>,
  direction: "asc" | "desc" | "orig" = "asc",
  cache: ApiCache,
): boolean => {
  if (direction === "orig") return true;
  return [...nodes].every((curr, i, arr) => {
    if (i === 0) return true;

    const prevOrder = getDateFromCache(arr[i - 1], cache) || 0;
    const currOrder = getDateFromCache(curr, cache) || 0;

    return direction === "asc"
      ? prevOrder <= currOrder
      : prevOrder >= currOrder;
  });
};

export const sortList = (
  nodeList: NodeListOf<HTMLDivElement>,
  cache: ApiCache,
  direction: "asc" | "desc" | "orig" = "asc",
): HTMLDivElement[] => {
  if (isSorted(nodeList, direction, cache)) {
    console.log("Already sorted in", direction, "order 🟣");
    return [...nodeList];
  }

  const sortedList = [...nodeList].sort((a, b) => {
    const aDate = getDateFromCache(a, cache);
    const bDate = getDateFromCache(b, cache);
    return aDate - bDate;
  });

  if (direction === "asc") return sortedList;

  return sortedList.reverse();
};

type getInfoFromElement = {
  tooltipNext: string;
  preview: string;
  href: string;
};

export const getInfoFromElement = (
  el: HTMLDivElement | null,
): getInfoFromElement => {
  if (!el)
    return {
      tooltipNext: "",
      preview: "",
      href: "",
    };

  const videoId = getVideoId(el);
  return {
    tooltipNext: el?.querySelector("#video-title")?.textContent ?? "",
    preview: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    href: el.querySelector("a")?.href ?? "",
  };
};
