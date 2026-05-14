let baseTitle = document.title || "WARLORDS";
let titleTimerId = null;

export const setBaseBrowserTitle = (title) => {
  baseTitle = title || "WARLORDS";

  if (!titleTimerId) {
    document.title = baseTitle;
  }
};

export const stopMovingBrowserTitle = () => {
  window.clearInterval(titleTimerId);
  titleTimerId = null;
  document.title = baseTitle;
};

export const startMovingBrowserTitle = (message) => {
  const cleanMessage = String(message || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanMessage) {
    return;
  }

  window.clearInterval(titleTimerId);
  titleTimerId = null;
  document.title = cleanMessage;
};
