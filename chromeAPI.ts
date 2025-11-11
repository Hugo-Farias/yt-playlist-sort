import { clog, getCache, getListId, localGet, localSet } from "@/helper.ts";
import type { YoutubePlaylistResponse } from "@/types.ts";
import { API_URL } from "./config";

const fetchJson = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(input, init);

  if (!res.ok) {
    if (res.status === 403 || res.status === 400) {
      return {} as T;
    }
    const errorText = await res.text();
    throw new Error(`Fetch error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as Promise<T>;
};

type GistFile = { keys: string[] };
type GistCache = { keys: string[]; fetchedAt: number };
const now = Date.now();

//  TEST: this!!!
export const fetchGist = async (): Promise<GistFile> => {
  console.log("Gist Called");

  const chachedGist: GistCache = JSON.parse(
    localGet("ytSortGist", true) || "null",
  );

  const cacheIsOld = chachedGist
    ? chachedGist.fetchedAt - now >= 24 * 60 * 60 * 1000
    : true;

  console.log("chachedGist ==> ", chachedGist);

  const data: GistCache | GistFile = cacheIsOld
    ? await fetchJson<GistFile>(
        "https://gist.githubusercontent.com/Hugo-Farias/73ecbbbf06598d234bd795b9d8696a0f/raw/ytSort.json",
      )
    : chachedGist;

  if (!data) {
    if (chachedGist) {
      console.log("Using cached Gist");

      return chachedGist;
    }

    clog("No API keys found in the Gist. Using default key.");
    return { keys: ["AIyzaSyD9ByeJ-rnx_0V2EiMQzWVNmnvx679KOcY"] };
  }

  localSet("ytSortGist", { ...data, fetchedAt: Date.now() }, true);

  return data;
};

let gist: GistFile;

let keyNum: number = new Date().getSeconds();
let tries = 0;

export const playlistAPI = async (
  playlistId: string,
  nextpageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> => {
  if (!playlistId) return null;

  clog("chromeAPI called");

  gist = gist || (await fetchGist());
  const key = gist.keys[keyNum % gist.keys.length] || "";

  const data = await fetchJson<YoutubePlaylistResponse>(
    `${API_URL}&playlistId=${playlistId}&key=${key}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
  );

  if (!data.etag) {
    tries++;
    if (tries >= gist.keys.length) {
      console.error("All API keys have been tried and failed.");
      return null;
    }
    clog("API key failed, rotating key");
    keyNum++;
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
