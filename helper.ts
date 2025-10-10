import { playlistItemSelector } from "@/config.ts";
import type {
  ApiCache,
  ApiCacheItems,
  YoutubePlaylistResponse,
  YtSortOrder,
} from "@/types.ts";

const { log } = console;

export const clog = (...content: Parameters<typeof log>) => {
  log("YT-Playlist-Sort:", ...content);
};

type localSorageKeys =
  | "ytSortLoop"
  | "ytSortMainCache"
  | "ytSortRenderedCache"
  | "ytSortVersion";

export const clearOldCache = (version: string) => {
  Object.keys(localStorage).forEach((key: string) => {
    if (!key.startsWith("ytSort")) return;
    localStorage.removeItem(key);
  });

  clog(`Updated to version ${version}, clearing cache 🧹`);
};

export const localSet = (
  keyname: localSorageKeys,
  obj: object | string,
  session: boolean = false,
) => {
  const data = JSON.stringify(obj);
  if (session) {
    sessionStorage.setItem(keyname, data);
    return null;
  }

  localStorage.setItem(keyname, data);
};

export const localGet = (
  keyname: localSorageKeys,
  session: boolean = false,
) => {
  let data: string | null;
  if (session) {
    data = sessionStorage.getItem(keyname);
  } else {
    data = localStorage.getItem(keyname);
  }

  if (!data) return null;
  if (typeof data === "string") return data;

  return JSON.parse(data);
};

export const localRemove = (
  keyname: localSorageKeys,
  session: boolean = false,
) => {
  if (session) {
    sessionStorage.removeItem(keyname);
    return null;
  }

  localStorage.removeItem(keyname);
};

export const localAdd = (keyname: localSorageKeys, add: object) => {
  const data = localGet(keyname);

  if (!data) return null;

  const parsedData: { [key: string]: ApiCache } = JSON.parse(data);
  const listId = getListId(location.href);

  localStorage.setItem(
    keyname,
    JSON.stringify({
      ...parsedData,
      [listId]: { ...parsedData[listId], ...add },
    }),
  );
};

export const getListId = (url: string | undefined): string => {
  if (!url || url.length <= 0) return "";
  const listId = new URL(url).searchParams.get("list") ?? "";
  if (listId.startsWith("PL")) return listId;
  return "";
};

export const getVideoId = (url: string | undefined | Element): string => {
  if (url instanceof Element) {
    url = url.querySelector("a")?.href;
  }
  if (!url || url.length <= 0) return "";
  return new URL(url).searchParams.get("v") ?? "";
};

type storeCacheDataParam<T extends string> = T extends "ytSortMainCache"
  ? YoutubePlaylistResponse
  : string[];

function removeEmojis(str: string): string {
  return str
    .replace(
      // covers pictographs, symbols, flags, modifiers, etc.
      /(?:\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})*(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})*)*)/gu,
      "",
    )
    .trim();
}

export const storeCache = <T extends "ytSortMainCache" | "ytSortRenderedCache">(
  storageKey: T,
  data: storeCacheDataParam<T> | null,
  playlistId: string,
) => {
  if (!data || !playlistId) return null;
  clog("storeCache =>", playlistId);

  if (storageKey === "ytSortRenderedCache") {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ ...localGet(storageKey), [playlistId]: data }),
    );
  } else if (storageKey === "ytSortMainCache") {
    const playlistData = data as YoutubePlaylistResponse;
    const newItems = playlistData.items.reduce(
      (acc, item, index) => {
        acc[item.contentDetails.videoId] = {
          title: removeEmojis(item.snippet.title),
          index: index,
          publishedAt: new Date(item.contentDetails.videoPublishedAt).getTime(),
        };

        return acc;
      },
      {} as ApiCache["items"],
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...localGet(storageKey),
        [playlistId]: {
          items: newItems,
          listId: playlistId,
          storeTime: Date.now(),
          totalResults: playlistData.pageInfo.totalResults,
          isReversed: false,
          etag: playlistData.etag,
        } as ApiCache,
      }),
    );
  }
};

type getCacheRT<T extends string> = T extends "ytSortMainCache"
  ? ApiCache
  : string[];

// Get a specific cache entry by playlist ID
export const getCache = <T extends "ytSortMainCache" | "ytSortRenderedCache">(
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

// type getFullCacheRT<T extends string> = T extends "ytSortMainCache"
//   ? { [key: string]: ApiCache }
//   : { [key: string]: RenderedPlaylistItem[] };
//
// export const getFullCache = <T extends "ytSortMainCache" | "ytSortRenderedCache">(
//   storageKey: T,
// ): getFullCacheRT<T> | null => {
//   const data = localStorage.getItem(storageKey);
//   if (!data) return null;
//   return JSON.parse(data) as getFullCacheRT<T>;
// };

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
  return cache.items[videoId ?? ""]?.publishedAt ?? Infinity;
};

const getFromCache = (
  el: HTMLDivElement,
  cache: ApiCache,
  type: keyof ApiCacheItems,
) => {
  const videoId = getVideoId(el);
  return cache.items[videoId ?? ""]?.[type] ?? Infinity;
};

const sortList = (
  nodeList: NodeListOf<HTMLDivElement>,
  cache: ApiCache,
  direction: YtSortOrder = "orig",
): HTMLDivElement[] => {
  let order: keyof ApiCacheItems;
  if (direction === "date") order = "publishedAt";
  if (direction === "orig") order = "index";
  if (direction === "title") order = "title";

  const sortedList = [...nodeList].sort((a, b) => {
    const aInfo = getFromCache(a, cache, order);
    const bInfo = getFromCache(b, cache, order);
    if (typeof aInfo === "number") {
      return aInfo - (bInfo as number); // numeric sort
    } else {
      return aInfo.localeCompare(bInfo as string); // string sort
    }
  });

  return sortedList;
};

type GetInfoFromElementRT = {
  videoTitle: string;
  preview: string;
  href: string;
};

export const unusedFunction = () => {
  return null;
};

export const getInfoFromElement = (
  el: Element | null,
): GetInfoFromElementRT | null => {
  if (!el) return null;

  const videoId = getVideoId(el);
  return {
    videoTitle:
      el?.querySelector("#video-title")?.textContent?.trim() ??
      el?.querySelector("span[role=text]")?.textContent?.trim() ??
      "",
    preview: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    href: el.querySelector("a")?.href ?? "",
  };
};

export const replaceTooltipInfo = (
  element: HTMLAnchorElement | null,
  info: GetInfoFromElementRT | null,
) => {
  if (!element) return null;
  if (!info) return null;

  element.dataset.tooltipText = info.videoTitle;
  element.dataset.preview = info.preview;
  element.href = info.href;

  if (!element.matches(":hover")) return null;
  element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
};

export const navigateEvent = (payload: object) => {
  const event = new CustomEvent("yt-navigate", {
    detail: {
      ...payload,
    },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const isShuffleOn = (): boolean => {
  const shuffleBtn = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Shuffle playlist"]',
  );

  return shuffleBtn?.getAttribute("aria-pressed") === "true";
};

export const isLoopOn = () => {
  return !!document.querySelector<HTMLButtonElement>(
    'button[aria-label="Loop video"]',
  );
};

export const sortRenderedPlaylist = (
  playlistContainer: HTMLDivElement | null,
  apiCache: ApiCache | null,
  order: YtSortOrder,
  reverse: boolean,
) => {
  if (!playlistContainer) return null;
  if (!apiCache) return null;

  const playlistItems: NodeListOf<HTMLDivElement> =
    playlistContainer.querySelectorAll(playlistItemSelector);

  const sortedList = sortList(playlistItems, apiCache, order);

  if (reverse) sortedList.reverse();

  sortedList.forEach(
    (el: HTMLDivElement, index: number, arr: HTMLDivElement[]) => {
      renderDateToElement(el, apiCache);
      playlistContainer.appendChild(el);

      if (getVideoId(el) !== getVideoId(location.href)) return; // Code below runs only on the current video

      const indexMessage = document.querySelector(
        "yt-formatted-string.index-message",
      )?.firstChild;

      if (indexMessage) indexMessage.textContent = `${index + 1}`;

      const nextVidInfo = getInfoFromElement(arr[index + 1]);

      const prevVidInfo = arr[index - 1];
      const prevBtn = document.querySelector(".ytp-prev-button.ytp-button");

      if (!prevVidInfo) {
        prevBtn?.setAttribute("hidden", "");
      } else {
        prevBtn?.removeAttribute("hidden");
      }

      const nextLabel = document.querySelector(
        "#next-video-title > #next-label",
      );

      const sibling = nextLabel?.nextSibling as HTMLDivElement;

      if (!nextVidInfo && nextLabel && nextLabel.nextSibling) {
        nextLabel.textContent = "End of playlist";
        sibling.textContent = "";
      } else if (nextLabel?.nextSibling) {
        nextLabel.textContent = "Next:";
        sibling.textContent = nextVidInfo?.videoTitle ?? "";
        sibling.removeAttribute("is-empty");
      }
    },
  );

  // moves "unavailable videos are hidden" message back to bottom of playlist
  const messageRender = playlistContainer.querySelector("ytd-message-renderer");
  if (!messageRender) return null;
  playlistContainer.appendChild(messageRender);
};
