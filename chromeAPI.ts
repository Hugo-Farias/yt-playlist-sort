import {
  cerr,
  checkCacheAge,
  clog,
  cwarn,
  getCache,
  getListId,
  getSettings,
  localGet,
  localSet,
} from "@/helper";
import type { GistFile, YoutubePlaylistResponse } from "@/types.ts";
import { API_URL, GIST_URL } from "./config";

const fetchJson = async <T = unknown>(
  input: RequestInfo,
): Promise<T | null> => {
  clog("FetchJson Called with URL:", input);
  const res = await fetch(input);
  if (!res.ok) {
    return null;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const testYTApiKey = async (key: string) => {
  const testUrl = `${API_URL}&playlistId=PLBCF2DAC6FFB574DE&key=${key}&maxResults=1`;
  try {
    const testResponse = await fetch(testUrl);
    clog("testResponse ==>", testResponse.status);
    if (!testResponse.ok) {
      cerr("API Key test failed with status:", testResponse.status);
      return testResponse.status;
    } else {
      clog("API Key is valid.");
      return 200;
    }
  } catch (error) {
    cerr("Error during API Key test:", error);
    return error;
  }
};

const gistDefault: GistFile = {
  keys: ["AIzaSyD9ByeJ-rnx_0V2EiMQzWVNmnvx679KOcY"],
  API_URL:
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50",
  playlistItemSelector:
    "ytd-playlist-panel-video-renderer#playlist-items:not([within-miniplayer])",
};

export const fetchGist = async (): Promise<GistFile> => {
  const gistCache: GistFile = JSON.parse(localGet("ytSortGist") || "null");

  const cacheIsOld = gistCache
    ? checkCacheAge(gistCache.fetchedAt || Infinity, 0.3)
    : true;

  const data: GistFile | null = cacheIsOld
    ? await fetchJson<GistFile>(GIST_URL)
    : gistCache;

  if (!data) {
    cerr("Fetch failed.");
    if (gistCache) {
      cerr("Using cached gist data");
      return gistCache;
    }

    cerr("Gist cache could not be accessed. Using default.");
    return gistDefault;
  }

  localSet("ytSortGist", { ...data, fetchedAt: Date.now() });

  return data;
};

let gist: GistFile;

let keyNum: number;

export const playlistAPI = async (
  playlistId: string,
  nextpageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> => {
  if (!playlistId) return null;

  clog("chromeAPI called");

  const settings = await getSettings();

  let key: string = "";

  if (settings.optApi && settings.apiString && settings.apiString.length > 0) {
    key = settings.apiString;
  } else {
    gist = gist || (await fetchGist());
    keyNum = Math.floor(Math.random() * gist.keys.length);
    key = gist.keys[keyNum] || "";
  }

  const data = await fetchJson<YoutubePlaylistResponse>(
    `${API_URL}&playlistId=${playlistId}&key=${key}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
  );

  if (!data) {
    if (gist.keys.length === 0) {
      cerr("All API keys have been tried and failed.");
      return null;
    }
    cwarn("API key failed, rotating key");
    gist.keys.splice(keyNum, 1);
    return playlistAPI(playlistId, nextpageToken);
  }

  if (!data.pageInfo || data.pageInfo.totalResults === 0) return null;

  const apiCache = getCache("ytSortMainCache", getListId(window.location.href));

  if (apiCache?.etag === data.etag) {
    clog("etag match, interrupting fetch...");
    return null;
  }

  if (data.nextPageToken) {
    const recurData = await playlistAPI(playlistId, data.nextPageToken);
    if (!recurData) return null;
    return {
      ...data,
      items: [...data.items, ...recurData.items],
    };
  }

  return data;
};
