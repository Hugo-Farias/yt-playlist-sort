import { cerr, clog, sendBackgroundMsg } from "@/helper";
import { API_URL } from "./config";
import type { YoutubePlaylistResponse } from "./types";

// let gist: GistFile;

// let keyNum: number;

const fetchJson = async <T = unknown>(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<T | null> => {
  // clog("FetchJson called with key", keyNum);
  const res = await fetch(input, init);
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

// const gistDefault: GistFile = {
//   keys: [
//     "AIzaSyDFOxhO49IgS86Jp3DGYOWuFNlrJvqjDPg",
//     "AIzaSyATvBkZZuIozXHff3RQToHK_6XdgCXyvCE",
//     "AIzaSyD9ByeJ-rnx_0V2EiMQzWVNmnvx679KOcY",
//     "AIzaSyAwewKbm-UQxTH81fI4Wl5JGlKR8UQ6mbU",
//   ],
//   API_URL:
//     "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=100",
//   playlistItemSelector:
//     "ytd-playlist-panel-video-renderer#playlist-items:not([within-miniplayer])",
// };

// export const fetchGist = async (): Promise<GistFile> => {
//   const gistCache: GistFile = JSON.parse(localGet("ytSortGist") || "null");
//
//   const cacheIsOld = gistCache
//     ? checkCacheAge(gistCache.fetchedAt || Infinity, 0.3)
//     : true;
//
//   const data: GistFile | null = cacheIsOld
//     ? await fetchJson<GistFile>(GIST_URL)
//     : gistCache;
//
//   if (!data) {
//     cerr("Fetch failed.");
//     if (gistCache) {
//       cerr("Using cached gist data");
//       return gistCache;
//     }
//
//     cerr("Gist cache could not be accessed. Using default.");
//     return gistDefault;
//   }
//
//   localSet("ytSortGist", { ...data, fetchedAt: Date.now() });
//
//   return data;
// };

const constructApiUrl = (
  playlistId: string,
  nextPageToken: string | null = null,
) => {
  const playlistUrl = `playlistId=${playlistId}`;
  const nextPageUrl = nextPageToken ? `pageToken=${nextPageToken}` : "";
  return [API_URL, playlistUrl, nextPageUrl].join("&");
};

// TODO: Finish this
export const callPlaylistAPI = async (
  playlistId: string,
  nextPageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> => {
  if (!playlistId) return null;

  console.log("test🟢🟢🟢🟢🟢");
  // TODO: Set timeout, send notification if token doesn't return in time
  const token = await sendBackgroundMsg("get-token");

  console.log("✔️ token ==>", token);

  const data = await fetchJson<YoutubePlaylistResponse>(
    constructApiUrl(playlistId, nextPageToken),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  console.log("✔️ data ==>", data);

  if (!data) return null;

  if (data.nextPageToken) {
    const recurData = await callPlaylistAPI(playlistId, data.nextPageToken);
    if (!recurData) return null;
    return {
      ...data,
      items: [...data.items, ...recurData.items],
    };
  }

  return data;
};

// export const playlistAPI = async (
//   playlistId: string,
//   nextpageToken: string | null = null,
// ): Promise<YoutubePlaylistResponse | null> => {
//   if (!playlistId) return null;
//
//   clog("chromeAPI called");
//
//   const settings = await getSettings();
//
//   let key: string = "";
//
//   if (settings.optApi && settings.apiString && settings.apiString.length > 0) {
//     key = settings.apiString;
//   } else {
//     gist = gist || (await fetchGist());
//     keyNum = Math.floor(Math.random() * gist.keys.length);
//     key = gist.keys[keyNum] || "";
//   }
//
//   const data = await fetchJson<YoutubePlaylistResponse>(
//     `${API_URL}&playlistId=${playlistId}&key=${key}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
//   );
//
//   if (!data) {
//     if (gist.keys.length === 0) {
//       cerr("All API keys have been tried and failed.");
//       return null;
//     }
//     cwarn(`API key number ${keyNum} failed`);
//     gist.keys.splice(keyNum, 1);
//     return playlistAPI(playlistId, nextpageToken);
//   }
//
//   if (!data.pageInfo || data.pageInfo.totalResults === 0) return null;
//
//   const apiCache = getCache("ytSortMainCache", getListId(window.location.href));
//
//   if (apiCache?.etag === data.etag) {
//     clog("etag match, interrupting fetch...");
//     return null;
//   }
//
//   if (data.nextPageToken) {
//     const recurData = await playlistAPI(playlistId, data.nextPageToken);
//     if (!recurData) return null;
//     return {
//       ...data,
//       items: [...data.items, ...recurData.items],
//     };
//   }
//
//   return data;
// };
