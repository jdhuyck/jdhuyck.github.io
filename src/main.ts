import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';

import { Router, type ViewHandle } from './router';
import { site } from './site';
import { createNav } from './components/nav';
import { createFooter } from './components/footer';
import { createRouteWipe } from './components/route-wipe';
import { createHomeView } from './views/home';
import { createLinksView } from './views/links';
import { createLabView } from './views/lab';
import { createNotFoundView } from './views/not-found';

const app = document.getElementById('app')!;
const outlet = document.createElement('main');
outlet.className = 'app__outlet';
outlet.id = 'main';

const skip = document.createElement('a');
skip.className = 'skip-link';
skip.href = '#main';
skip.dataset.router = 'off';
skip.textContent = 'Skip to content';

const wipe = createRouteWipe();

const router = new Router(outlet, {
  baseTitle: `${site.name} · ${site.role}`,
  notFound: createNotFoundView,
  transition: wipe.transition,
});

router
  .add('/', createHomeView)
  .add('/links', createLinksView)
  .add('/teaching', (ctx) => { ctx.router.navigate('/links', { replace: true }); return createLinksView(); })
  .add('/lab', createLabView)
  .add('/blog', async (ctx) => (await import('../packages/blog/src')).createBlogListView(ctx))
  .add('/blog/:slug', async (ctx) => (await import('../packages/blog/src')).createBlogPostView(ctx))
  .add('/forms', async () => (await import('../packages/form-editor/src/view')).createFormEditorView());

// Local blog editor: dev server only, and only if packages/blog-admin exists
// (it can live in a private submodule). Dropped from production builds.
if (import.meta.env.DEV) {
  const admin = import.meta.glob<{ createBlogAdminView: () => ViewHandle }>('../packages/blog-admin/src/view.ts');
  const load = Object.values(admin)[0];
  if (load) router.add('/admin', async () => (await load()).createBlogAdminView());
}

// Lets CSS adapt chrome per section (e.g. no footer in the full-height form editor).
router.onChange(path => { document.body.dataset.route = path.split('/')[1] || 'home'; });

app.append(skip, createNav(router), outlet, wipe.el, createFooter());
router.start();
