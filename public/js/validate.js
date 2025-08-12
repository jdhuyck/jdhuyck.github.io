function validateLinks() {
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    fetch(link.href)
      .then((res) => {
        if (!res.ok) console.warn(`Broken link: ${link.href}`);
      })
      .catch(() => console.error(`Failed to fetch: ${link.href}`));
  });
}

function validateStructure() {
  const requiredSelectors = ['header', 'main', 'footer'];
  requiredSelectors.forEach((selector) => {
    if (!document.querySelector(selector)) {
      console.error(`Missing required element: ${selector}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (process.env.NODE_ENV === 'development') {
    validateLinks();
    validateStructure();
  }
});
