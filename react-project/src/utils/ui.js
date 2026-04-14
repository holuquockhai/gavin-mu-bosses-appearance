export const closeOffcanvas = (id = "offcanvasLeft") => {
  const el = document.getElementById(id);
  if (!el) return;

  // make sure bootstrap exists
  if (window.bootstrap) {
    const instance = window.bootstrap.Offcanvas.getInstance(el);
    instance?.hide();
  }
};