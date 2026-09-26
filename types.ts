export type RenderedPlaylistItem = {
  videoId: string | null;
};

export type GistFile = {
  keys: string[];
  API_URL: string;
  playlistItemSelector: string;
  fetchedAt?: number;
};

export type YoutubePlaylistResponse = {
  etag: string;
  nextPageToken: string;
  items: YouTubePlaylistItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};

type YouTubePlaylistItem = {
  snippet: {
    title: string;
    channelTitle: string;
  };
  contentDetails: {
    videoId: string;
    videoPublishedAt: string;
  };
};

export type YtSortOrder = "orig" | "date" | "title";

export type ApiCacheItems = {
  channelTitle: string;
  index: number;
  publishedAt: number;
  title: string;
};

export type ApiCache = {
  videos: {
    [videoId: string]: ApiCacheItems;
  };
  listId: string;
  storeTime: number;
  totalResults: number;
  isReversed: boolean;
  sortOrder: YtSortOrder;
  etag: string;
};

type YTWatchEndpoint = {
  videoId: string;
  playlistId?: string;
  index?: number;
};

export type YTNavigateEvent = CustomEvent<{
  ytSort?: "next" | "prev" | "videoEnd";
  tempData?: {
    autonav?: "1";
    lact?: number;
  };
  endpoint?: {
    watchEndpoint?: YTWatchEndpoint;
    commandMetadata?: {
      webCommandMetadata?: {
        url?: string;
        webPageType?: string;
        rootVe?: number;
      };
    };
  };
}>;
