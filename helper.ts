import type {
  ApiCache,
  ApiCacheItems,
  YoutubePlaylistResponse,
  YtSortOrder,
} from "@/types.ts";
import type { SettingsT } from "./entrypoints/popup/App";
import "./data/LANGUAGES";
import { playlistItemSelector } from "./config";

const { log, error, warn } = console;

export const clog = (...content: Parameters<typeof log>) => {
  log("Playlist Sorter for YouTube:", ...content);
};

export const cwarn = (...content: Parameters<typeof warn>) => {
  warn("Playlist Sorter for YouTube:", ...content);
};

export const cerr = (...content: Parameters<typeof error>) => {
  error("Playlist Sorter for YouTube: 🔴", ...content);
};

type localStorageKeys =
  | "ytSortLoop"
  | "ytSortMainCache"
  | "ytSortRenderedCache"
  | "ytSortVersion"
  | "ytSortGist";

export const cleanCache = (msg?: string) => {
  Object.keys(localStorage).forEach((key: string) => {
    if (!key.startsWith("ytSort")) return;
    localStorage.removeItem(key);
  });

  if (!msg) return;
  clog(msg);
};

export const localSet = (
  keyname: localStorageKeys,
  obj: object | string[] | string | boolean,
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
  keyname: localStorageKeys,
  session: boolean = false,
): string | null => {
  let data: string | null;
  if (session) {
    data = sessionStorage.getItem(keyname);
  } else {
    data = localStorage.getItem(keyname);
  }

  if (!data) return null;

  return data;
};

export const localRemove = (
  keyname: localStorageKeys,
  session: boolean = false,
) => {
  if (session) {
    sessionStorage.removeItem(keyname);
    return null;
  }

  localStorage.removeItem(keyname);
};

export const localAdd = (
  keyname: "ytSortMainCache" | "ytSortRenderedCache",
  add: object | string[],
) => {
  const data = localGet(keyname);

  if (!data) return null;

  const parsedData: { [key: string]: ApiCache } = JSON.parse(data);
  const listId = getListId(location.href);

  const content =
    keyname === "ytSortMainCache" ? { ...parsedData[listId], ...add } : add;

  localStorage.setItem(
    keyname,
    JSON.stringify({
      ...parsedData,
      [listId]: content,
    }),
  );
};

export const getSettings = (): Promise<SettingsT> =>
  new Promise((resolve) => {
    chrome.storage.local.get((items) => {
      resolve(items as SettingsT);
    });
  });

let timeoutTimer: ReturnType<typeof setTimeout>;

export const debounce = (callback: () => void, delay: number = 500) => {
  clearTimeout(timeoutTimer);

  timeoutTimer = setTimeout(() => {
    callback();
  }, delay);
};

export const waitForElement = (
  selector: string,
  timeout = 20000,
): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        clearTimeout(timer);
        resolve(el);
      }
    }, 1000);

    const timer = setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
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

function removeEmojis(str: string): string {
  return str
    .replace(
      // covers pictographs, symbols, flags, modifiers, etc.
      /(?:\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})*(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})*)*)/gu,
      "",
    )
    .trim();
}

export const storeMainCache = (
  data: YoutubePlaylistResponse,
  playlistId: string,
) => {
  if (!data || !playlistId) return null;
  clog("storeCache =>", data);
  const originalCache = getCache("ytSortMainCache", playlistId);

  const newItems = data.items.reduce(
    (acc, item, index) => {
      acc[item.contentDetails.videoId] = {
        title: removeEmojis(item.snippet.title),
        index: index,
        publishedAt: new Date(item.contentDetails.videoPublishedAt).getTime(),
        channelTitle: item.snippet.channelTitle,
      };

      return acc;
    },
    {} as ApiCache["videos"],
  );

  localSet("ytSortMainCache", {
    ...JSON.parse(localGet("ytSortMainCache") || "{}"),
    [playlistId]: {
      videos: newItems,
      listId: playlistId,
      storeTime: Date.now(),
      totalResults: data.pageInfo.totalResults,
      isReversed: originalCache?.isReversed || false,
      sortOrder: originalCache?.sortOrder || "orig",
      etag: data.etag,
    } as ApiCache,
  });
};

type getCacheRT<T extends string> = T extends "ytSortMainCache"
  ? ApiCache
  : string[];

// Get a specific cache entry by playlist ID
export const getCache = <T extends "ytSortMainCache" | "ytSortRenderedCache">(
  storageKey: T,
  playlistId: string | null,
): getCacheRT<T> | null => {
  if (!storageKey || !playlistId) return null;
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
  return listA.every((id, index) => id === idList[index]);
};

// Format the date to a human-readable format
export const formatDate = (
  dateInput: Date | number,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  locale = "en-GB",
): string => {
  const date = new Date(dateInput);
  return date.toLocaleDateString(locale, options);
};

export const parseLang = (langSetting: SettingsT | undefined) => {
  let lang = langSetting?.dateLanguage;

  if (lang === "browser") {
    lang = navigator.language as "browser";
  } else if (lang === "youtube") {
    lang = langSetting?.lang as "youtube";
  }
  return lang || navigator.language;
};

export const renderDateToElement = (el: HTMLDivElement, cache: ApiCache) => {
  const dateEl = el.querySelector(".playlistSort-date");
  if (dateEl) dateEl.remove();

  chrome.storage.local.get<SettingsT>((settings) => {
    if (!settings.date) return;

    const itemEl = el.querySelector<HTMLSpanElement>("#byline-container");
    if (!itemEl) return null;

    const lang = parseLang(settings);

    const videoItem = cache.videos[getVideoId(el) ?? ""];

    const formattedDate = formatDate(
      videoItem.publishedAt ?? Infinity,
      {
        day: "numeric",
        month: settings.dateFormat,
        year: "numeric",
      },
      lang,
    );

    const span = document.createElement("span");
    span.textContent = `• ${formattedDate}`;
    span.classList.add(
      "style-scope",
      "ytd-playlist-panel-video-renderer",
      "playlistSort-date",
    );
    span.id = "byline";
    span.style.marginLeft = "-4.2px";
    span.style.marginRight = "-50px";
    // span.style.margin = "-100px";

    itemEl.appendChild(span);
    itemEl.style.paddingRight = "0";
    itemEl.setAttribute(
      "title",
      `${videoItem.channelTitle} - ${formattedDate}`,
    );
  });
};

const getFromCache = (
  el: HTMLDivElement,
  cache: ApiCache,
  type: keyof ApiCacheItems,
) => {
  const videoId = getVideoId(el);
  return cache.videos[videoId ?? ""]?.[type] ?? Infinity;
};

const sortList = (
  nodeList: NodeListOf<HTMLDivElement>,
  cache: ApiCache,
): HTMLDivElement[] => {
  let order: keyof ApiCacheItems;
  const direction: YtSortOrder = cache.sortOrder || "orig";
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
    "#top-level-buttons-computed > ytd-toggle-button-renderer > yt-button-shape > button",
  );

  return shuffleBtn?.getAttribute("aria-pressed") === "true";
};

export const isLoopOn = (): boolean => {
  const loopBtn = document.querySelector(
    "#button > ytd-button-renderer > yt-button-shape > button > div > span > span > div > svg > path",
  );

  const output = loopBtn?.getAttribute("d")?.startsWith("M21");

  return output ? output : false;
};

const newLayout =
  document.querySelector(".ytp-left-controls")?.firstElementChild?.className ===
  "ytp-play-button ytp-button";

export const sortRenderedPlaylist = (
  playlistContainer: HTMLDivElement | null,
  apiCache: ApiCache | null,
): void => {
  if (!playlistContainer) throw new Error("Playlist container not found");
  if (!apiCache) throw new Error("API cache missing");

  const playlistItems: NodeListOf<HTMLDivElement> =
    playlistContainer.querySelectorAll(playlistItemSelector);

  const sortedList = sortList(playlistItems, apiCache);

  if (apiCache.isReversed) sortedList.reverse();

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

      if (!prevVidInfo && !newLayout) {
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

      // Focus back on playing video item
      chrome.storage.local.get<SettingsT>((settings) => {
        if (!settings.scroll) return;
        setTimeout(() => {
          playlistContainer.scrollTo({
            top: el.offsetTop - playlistContainer.offsetHeight / 1.5,
            behavior: "smooth",
          });
        }, 200);
      });
    },
  );

  // moves "unavailable videos are hidden" message back to bottom of playlist
  const messageRender = playlistContainer.querySelector("ytd-message-renderer");
  if (!messageRender) return;
  playlistContainer.appendChild(messageRender);
};

export const checkCacheAge = (cacheAge: number, hours: number): boolean => {
  const maxAge = 1000 * 60 * 60 * hours;
  const currentTime = Date.now();
  return currentTime - cacheAge >= maxAge;
};

export const cleanOldMainCacheEntries = (fullCache: {
  [key: string]: ApiCache;
}) => {
  if (!fullCache) return null;
  const keys = Object.keys(fullCache ?? {});
  if (!keys.length) return null;

  keys.forEach((key) => {
    const entry = fullCache[key];
    if (checkCacheAge(entry.storeTime, 300)) {
      clog(`Cleaning old cache entry for playlist ID: ${key} 🧹`);
      const updatedCache = JSON.parse(localGet("ytSortMainCache") ?? "{}");
      delete updatedCache[key];
      localSet("ytSortMainCache", updatedCache);
    }
  });
};
