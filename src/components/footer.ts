import { site } from '../site';

export function createFooter(): HTMLElement {
  const el = document.createElement('footer');
  el.className = 'footer';
  const links = [
    '<a href="/lab">lab</a>',
    site.links.email && `<a href="mailto:${site.links.email}">email</a>`,
    site.links.github && `<a href="${site.links.github}" rel="noopener">github</a>`,
  ].filter(Boolean).join('<span class="output--dim">·</span>');

  el.innerHTML = `
    <div class="container footer__inner">
      <p class="footer__line">
        <span class="prompt">exit</span>
        <span class="output--dim">0</span>
        <span class="output--muted">© ${new Date().getFullYear()} ${site.name} · ${site.role}</span>
      </p>
      ${links ? `<p class="footer__links">${links}</p>` : ''}
    </div>
  `;
  return el;
}
