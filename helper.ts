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

export const getVideoId = (url: string | undefined): string => {
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

const renderDateToElement = (el: HTMLDivElement) => {
  if (el.querySelector(".playlistSort-date")) return null;

  const itemEl = el.querySelector("#byline-container");
  if (!itemEl) return null;

  const videoPublishedAt = Number(el.dataset.date);

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

  return el;
};

const addInfoToElement = (
  el: HTMLDivElement,
  cache: ApiCache,
): HTMLDivElement => {
  // if (el.dataset.date) return el;
  const output = el;
  const videoId = getVideoId(output.querySelector("a")?.href);
  const date = cache.items[videoId ?? ""]?.videoPublishedAt ?? Infinity;
  output.dataset.date = String(date);
  return output;
};

const isSorted = (
  nodes: HTMLDivElement[],
  direction: "asc" | "desc" = "asc",
): boolean => {
  return nodes.every((curr, i, arr) => {
    if (i === 0) return true;

    const prevOrder = Number(arr[i - 1].dataset.date) || 0;
    const currOrder = Number(curr.dataset.date) || 0;

    return direction === "asc"
      ? prevOrder <= currOrder
      : prevOrder >= currOrder;
  });
};

export const sortPlaylist = (
  items: HTMLDivElement[],
  cache: ApiCache,
  selector: string,
  direction: "asc" | "desc" | "orig" = "asc",
) => {
  if (!items || items.length === 0) return;
  if (!cache || !cache.items) return;
  if (direction === "orig") return Array.from(items);

  const newItems = items.map((item) => addInfoToElement(item, cache));

  // if (isSorted(newItems, direction)) {
  //   console.log("Playlist already sorted in", direction, "order.");
  //   return null;
  // }

  const sortedItems = newItems.sort((a, b) => {
    const aPublishedAt = Number(a.dataset.date) || 0;
    const bPublishedAt = Number(b.dataset.date) || 0;

    if (direction === "asc") return aPublishedAt - bPublishedAt;
    return aPublishedAt - bPublishedAt;
  });

  const playlistContainer = document.querySelector(selector);

  if (!playlistContainer) return null;
  console.log("Sorting Playlist");

  playlistContainer.innerHTML = "";

  // playlistContainer.append(...sortedItems);

  // const frag = document.createDocumentFragment();
  // sortedItems.forEach((el) => frag.appendChild(el));
  // playlistContainer.appendChild(frag);

  sortedItems.forEach((item) => {
    const playlistContainer = document.querySelector(selector);
    renderDateToElement(item);
    playlistContainer?.appendChild(item);
  });
};
