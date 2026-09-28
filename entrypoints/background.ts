export type BackgroundMsg = "get-token";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message: BackgroundMsg) => {
    if (message === "get-token") {
      // TODO: test what this returns
      const { token } = await browser.identity.getAuthToken({
        interactive: true,
      });
      console.log("✔️ token ==>", token);

      return { token };
    }
  });
});
