import { getListId } from "@/helper.ts";

let timeout: NodeJS.Timeout;

let messagesSent = 0;

export type MessageType = {
  url: string;
  id: string | null;
};

const sendMsg = function (tabId: number, message: MessageType) {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    chrome.tabs.sendMessage(tabId, message).catch(() => {
      if (++messagesSent > 50) {
        console.error("failed to send message");
        return null;
      }
      console.log("Attempt #", messagesSent, "to send message");
      sendMsg(tabId, message);
    });
  }, 400);
};

// noinspection JSUnusedGlobalSymbols
export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  chrome.tabs.onUpdated.addListener(function (
    tabId: number,
    _: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab,
  ) {
    if (!tab.url?.includes("&list=PL")) return null;
    if (tab.status !== "complete") return null;

    messagesSent = 0;

    const { url } = tab;
    if (!url) return null;

    sendMsg(tabId, { url: url, id: getListId(url) || null });
  });
});
