export const showGlobalMessage = ({ message, variant = "success", duration = 5000 }) => {
  window.dispatchEvent(new CustomEvent("warlords:flash-message", {
    detail: {
      id: Date.now(),
      message,
      variant,
      duration,
    },
  }));
};
