export const getListId = (url: string) => {
  return new URL(url).searchParams.get("list");
};
