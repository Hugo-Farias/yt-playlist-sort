import {
  ApiCache,
  RenderedPlaylistItem,
  YoutubePlaylistResponse,
  YtSortOrder,
} from "@/types.ts";
import { playlistItemSelector } from "@/config.ts";
import pkg from "@/package.json";

export const clog = (...content: string[]) => {
  console.log("YT-Playlist-Sort: ", ...content);
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
  clog("storeCache =>", playlistId);

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

const getIndexFromCache = (el: HTMLDivElement, cache: ApiCache) => {
  const videoId = getVideoId(el);
  return cache.items[videoId ?? ""]?.originalIndex ?? Infinity;
};

const sortList = (
  nodeList: NodeListOf<HTMLDivElement>,
  cache: ApiCache,
  direction: YtSortOrder = "asc",
): HTMLDivElement[] => {
  if (direction === "orig" || direction === "origRev") {
    const originalOrder = [...nodeList].sort((a, b) => {
      const aIndex = getIndexFromCache(a, cache);
      const bIndex = getIndexFromCache(b, cache);
      return aIndex - bIndex;
    });

    if (direction === "origRev") return originalOrder.reverse();

    return originalOrder;
  }

  const sortedList = [...nodeList].sort((a, b) => {
    const aDate = getDateFromCache(a, cache);
    const bDate = getDateFromCache(b, cache);
    return aDate - bDate;
  });

  if (direction === "asc") return sortedList;

  return sortedList.reverse();
};

type GetInfoFromElementRT = {
  videoTitle: string;
  preview: string;
  href: string;
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

  refreshHover(element);
};

export const navigateEvent = (
  eventType: "yt-navigate" | "yt-navigate-finish",
  payload: {},
) => {
  const event = new CustomEvent(eventType, {
    detail: {
      ...payload,
    },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

function refreshHover(el: HTMLElement) {
  if (!el.matches(":hover")) return null;
  el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
}

export const sortRenderedPlaylist = (
  playlistContainer: HTMLDivElement,
  apiCache: ApiCache | null,
  direction: YtSortOrder,
  firstRun: boolean = false,
) => {
  console.log("direction ==> ", direction);
  const order = direction ?? "orig";

  if (!playlistContainer) return null;
  if (!apiCache) return null;

  const playlistItems: NodeListOf<HTMLDivElement> =
    playlistContainer.querySelectorAll(playlistItemSelector);

  const sortedList = sortList(playlistItems, apiCache, order);

  sortedList.forEach((el, index, arr) => {
    renderDateToElement(el, apiCache!);
    playlistContainer.appendChild(el);

    // if (index > arr.length - 1) return null;
    if (getVideoId(el) !== getVideoId(location.href)) return null; // Code below runs only on the current video
    const currentLocation = `${index + 1}/${arr.length}`;

    const indexMessage = document.querySelector<HTMLSpanElement>(
      "span.index-message.ytd-playlist-panel-renderer",
    );

    if (indexMessage) {
      indexMessage.textContent = currentLocation;
      indexMessage.removeAttribute("hidden");
      // indexMessage.style.marginRight = "1rem";
      indexMessage.nextElementSibling?.setAttribute("hidden", "");
    }

    const prevVidInfo = getInfoFromElement(arr[index - 1]);
    let nextVidInfo = getInfoFromElement(arr[index + 1]);

    const nextLabel = document.querySelector("#next-video-title > #next-label");

    const sibling = nextLabel?.nextSibling as HTMLDivElement;

    if (!nextVidInfo && nextLabel && nextLabel.nextSibling) {
      nextLabel.textContent = "End of playlist";
      sibling.textContent = "";
    } else if (nextLabel && nextLabel.nextSibling) {
      nextLabel.textContent = "Next:";
      sibling.textContent = nextVidInfo?.videoTitle ?? "";
      sibling.removeAttribute("is-empty");
    }

    setTimeout(() => {
      const prevBtnEl =
        document.querySelector<HTMLAnchorElement>(".ytp-prev-button");

      const nextBtnEl =
        document.querySelector<HTMLAnchorElement>(".ytp-next-button");

      if (!prevVidInfo) {
        if (prevBtnEl) prevBtnEl.setAttribute("hidden", "");
      } else {
        if (prevBtnEl) prevBtnEl.removeAttribute("hidden");
      }

      if (!nextVidInfo) {
        const nextRecomendedVidEl = document.querySelector<Element>(
          "yt-lockup-view-model",
        );
        if (nextRecomendedVidEl) {
          nextVidInfo = getInfoFromElement(nextRecomendedVidEl);
        }
      }

      replaceTooltipInfo(nextBtnEl, nextVidInfo);
      replaceTooltipInfo(prevBtnEl, prevVidInfo);

      if (firstRun) {
        prevBtnEl?.addEventListener("click", () => {
          clog("Prev button hover");
          sortRenderedPlaylist(
            playlistContainer,
            apiCache,
            localStorage.getItem("ytSortOrder") as YtSortOrder,
          );
        });
      }
    }, 1000);
  });
};
