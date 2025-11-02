import { clog, getCache, getListId } from "@/helper.ts";
import type { YoutubePlaylistResponse } from "@/types.ts";
import { API_URL } from "./config";

// let tries = 0;

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

export const fetchGist = async (): Promise<GistFile> => {
  const data = await fetchJson<GistFile>(
    "https://gist.githubusercontent.com/Hugo-Farias/73ecbbbf06598d234bd795b9d8696a0f/raw/ytSort.json",
  );
  if (!data.keys || data.keys.length === 0) {
    throw new Error("No API keys found in the Gist.");
  }
  return data;
};

let gist: GistFile = { keys: ["AIzaSyBldSngj23rs8UpYW5yr9EPqKNxxnrGzRk"] };

let keyNum: number = new Date().getSeconds();
let tries = 0;

export const playlistAPI = async (
  playlistId: string,
  nextpageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> => {
  if (!playlistId) return null;

  clog("chromeAPI called");

  // if (!gist) {
  //   gist = await fetchGist();
  //   gist = { keys: [...dummyGist.keys, ...gist.keys] }; // TEST: remove this line before commiting
  // }

  // const keyNum = new Date().getSeconds() % dummyGist.keys.length;
  // const key = dummyGist.keys[keyNum] || "";
  // console.log("key ==> ", key);
  const key = gist.keys[keyNum % gist.keys.length] || "";

  const data = await fetchJson<YoutubePlaylistResponse>(
    `${API_URL}&playlistId=${playlistId}&key=${key}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
  );

  // TODO: store keys in local storage
  if (!data.etag) {
    tries++;
    // const now = Date.now();
    console.log("fetchGist called");
    if (gist.keys.length <= 1) gist = await fetchGist();
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
