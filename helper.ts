export const getListId = (url: string) => {
  return new URL(url).searchParams.get("list");
};

export const fetchURL = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};
