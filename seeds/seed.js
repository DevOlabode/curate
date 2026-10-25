#!/usr/bin/env node
// Seeds staging or a local database with test users and real developer links.
// Refuses to run anywhere else. Safe to re-run: it replaces the seed users' data.
//
//   APP_ENV=staging MONGO_URI=... SEED_PASSWORD=... node seeds/seed.js

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const mongoose = require('mongoose');
const { checkEnv } = require('../config/env');
const User = require('../models/user');
const Bookmark = require('../models/bookmark');
const Collection = require('../models/collection');

const USERS = ['seed_ada', 'seed_linus', 'seed_grace'];

// Real pages, plus cases the content pipeline (Phase 3) must handle.
const LINKS = [
  ['MDN: JavaScript reference', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference', 'Frontend', ['javascript', 'docs']],
  ['MDN: Using Fetch', 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', 'Frontend', ['javascript', 'http']],
  ['A complete guide to Flexbox', 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', 'Frontend', ['css', 'layout']],
  ['React: Thinking in React', 'https://react.dev/learn/thinking-in-react', 'Frontend', ['react']],
  ['React: useEffect', 'https://react.dev/reference/react/useEffect', 'Frontend', ['react', 'hooks']],
  ['Node.js: Event loop', 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick', 'Backend', ['node']],
  ['Express 5 migration guide', 'https://expressjs.com/en/guide/migrating-5.html', 'Backend', ['node', 'express']],
  ['Mongoose: Queries', 'https://mongoosejs.com/docs/queries.html', 'Backend', ['mongodb', 'mongoose']],
  ['MongoDB: Indexes', 'https://www.mongodb.com/docs/manual/indexes/', 'Backend', ['mongodb']],
  ['Atlas Search overview', 'https://www.mongodb.com/docs/atlas/atlas-search/', 'Backend', ['mongodb', 'search']],
  ['Rust book: Ownership', 'https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html', 'Languages', ['rust']],
  ['Go by Example', 'https://gobyexample.com/', 'Languages', ['go']],
  ['Python: asyncio', 'https://docs.python.org/3/library/asyncio.html', 'Languages', ['python', 'async']],
  ['Pro Git: Rebasing', 'https://git-scm.com/book/en/v2/Git-Branching-Rebasing', 'Tools', ['git']],
  ['GitHub Actions: workflow syntax', 'https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions', 'Tools', ['ci', 'github']],
  ['Docker: multi-stage builds', 'https://docs.docker.com/build/building/multi-stage/', 'Tools', ['docker']],
  ['Chrome extensions: Manifest V3', 'https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3', 'Extensions', ['chrome', 'mv3']],
  ['Chrome: activeTab permission', 'https://developer.chrome.com/docs/extensions/develop/concepts/activeTab', 'Extensions', ['chrome', 'permissions']],
  ['OWASP: SSRF prevention', 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html', 'Security', ['security', 'ssrf']],
  ['OWASP: Password storage', 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', 'Security', ['security', 'auth']],
  ['Stack Overflow: event delegation', 'https://stackoverflow.com/questions/1687296/what-is-dom-event-delegation', 'Frontend', ['javascript', 'dom']],
  ['Julia Evans: How DNS works', 'https://jvns.ca/blog/2022/02/01/a-dns-resolver-in-80-lines-of-go/', 'Networking', ['dns', 'go']],
  ['web.dev: Core Web Vitals', 'https://web.dev/articles/vitals', 'Frontend', ['performance']],
  ['The Twelve-Factor App', 'https://12factor.net/', 'Backend', ['architecture']],
  ['Keep a Changelog', 'https://keepachangelog.com/en/1.1.0/', 'Tools', ['process']],
  // Pipeline edge cases
  ['PDF: Raft paper', 'https://raft.github.io/raft.pdf', 'Edge cases', ['pdf']],
  ['404 page', 'https://developer.mozilla.org/en-US/docs/this-page-does-not-exist-curate', 'Edge cases', ['404']],
  ['Redirect chain', 'http://github.com/', 'Edge cases', ['redirect']],
  ['Private address (must be refused)', 'http://127.0.0.1:8080/admin', 'Edge cases', ['ssrf']],
  ['Cloud metadata (must be refused)', 'http://169.254.169.254/latest/meta-data/', 'Edge cases', ['ssrf']],
  ['Large page: ECMAScript spec', 'https://tc39.es/ecma262/', 'Edge cases', ['large']],
];

async function main() {
  const env = checkEnv();
  if (!['staging', 'development'].includes(env)) {
    throw new Error(`Seeding only runs with APP_ENV=staging or development (got ${env})`);
  }
  const password = process.env.SEED_PASSWORD || 'curate-seed-password';

  await mongoose.connect(process.env.MONGO_URI);
  const old = await User.find({ username: { $in: USERS } }, '_id');
  const oldIds = old.map((u) => u._id);
  await Bookmark.deleteMany({ user: { $in: oldIds } });
  await Collection.deleteMany({ owner: { $in: oldIds } });
  await User.deleteMany({ _id: { $in: oldIds } });

  for (const [i, username] of USERS.entries()) {
    const user = await User.register(
      new User({ username, email: `${username}@example.com`, firstName: username.slice(5), lastName: 'Seed', isInternal: true }),
      password
    );
    // Each user gets every link, in rotated order, filed into per-category collections.
    const links = LINKS.slice(i * 7).concat(LINKS.slice(0, i * 7));
    const byCategory = new Map();
    for (const [title, url, category, tags] of links) {
      if (!byCategory.has(category)) {
        byCategory.set(category, await Collection.create({ name: category, owner: user._id, user: user._id }));
      }
      const collection = byCategory.get(category);
      const bookmark = await Bookmark.create({ title, url, category, tags, user: user._id, collection: collection._id });
      collection.bookmarks.push(bookmark._id);
    }
    await Promise.all([...byCategory.values()].map((c) => c.save()));
  }
  console.log(`[seed] ${env}: ${USERS.length} users × ${LINKS.length} bookmarks. Password: SEED_PASSWORD (or the default).`);
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
