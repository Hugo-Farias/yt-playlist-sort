export type renderedPlaylistItem = {
  title: string;
  videoId: string | null;
};

export type YouTubePlaylistItem = {
  kind: "youtube#playlistItem";
  etag: string;
  id: string;
  contentDetails: {
    videoId: string;
    videoPublishedAt: string; // ISO 8601 date-time string
  };
};
1;
export type YouTubePlaylistContentDetails = {
  kind: "youtube#playlistItemListResponse";
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  items: YouTubePlaylistItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};

export type CachedPlaylistData = YouTubePlaylistContentDetails & {
  listId: string;
  storeTime: number;
};

export type countryIs = {
  ip: string;
  country: string;
};
