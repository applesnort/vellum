#!/usr/bin/env node
import {createRequire} from 'node:module';
import {existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const RULES = [
  ['empty-page', 'FAIL', 'no visible text, form control, image, svg, canvas or video in the body (the body is often still inside the template comment marker)'],
  ['h-scroll', 'FAIL', 'documentElement.scrollWidth > innerWidth; lists the widest elements that pass the right edge'],
  ['heading-stack', 'FAIL', '3+ heading-styled elements in a row (h1-h6, legend, card-title, field-legend, or a >=600-weight text element alone on its line with no controls), each below the last and overlapping it horizontally, with no content box between them'],
  ['gap-order', 'FAIL', 'a vertical gap between two stacked sections (section, fieldset, field-set, or a box whose first child is or holds a heading) must be larger than the largest gap between stacked fields ([data-slot=field] or label+control groups) inside those two sections'],
  ['box-smash', 'FAIL', 'two separate bordered boxes (border on all four sides or a ring, not nested, not fixed/sticky) that face each other with a gap above 0.5px and below 8px; touching boxes (<=0.5px) count as a joined group'],
  ['helper-ratio', 'WARN', 'more than 1/3 of [data-slot=field] elements show a field-description or a paragraph in a color other than the label color'],
  ['column-align', 'WARN', 'in a flex-row or grid row with 2+ side-by-side columns, the top edges of the first bordered box (all four sides or ring, 24px+, not a button, link or tab) in each column differ by more than 4px']
];

const USAGE = 'usage: node lint.mjs <draft.html> [--width 1440,390] [--shots <dir>]';

function parseArgs(argv) {
  const args = argv.slice(2);
  let file;
  let widths = [1440, 390];
  let shots;
  for(let i = 0; i < args.length; i++) {
    if(args[i] === '--width') {
      const raw = args[++i];
      if(!raw) {
        throw new Error(`--width needs a value. ${USAGE}`);
      }
      widths = raw.split(',').map(w => Number(w.trim()));
      if(widths.some(w => !Number.isInteger(w) || w < 200)) {
        throw new Error(`--width must be integers >= 200, got "${raw}"`);
      }
    } else if(args[i] === '--shots') {
      shots = args[++i];
      if(!shots) {
        throw new Error(`--shots needs a directory. ${USAGE}`);
      }
      shots = path.resolve(shots);
    } else if(!file) {
      file = args[i];
    } else {
      throw new Error(`unexpected argument "${args[i]}". ${USAGE}`);
    }
  }
  if(!file) {
    throw new Error(USAGE);
  }
  const abs = path.resolve(file);
  if(!existsSync(abs)) {
    throw new Error(`draft not found: ${abs}`);
  }
  return {file: abs, widths, shots};
}

function loadPlaywright() {
  const require = createRequire(path.join(process.cwd(), 'noop.js'));
  try {
    return require('playwright');
  } catch(e) {
    if(e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    console.error(
      `lint: cannot resolve "playwright" from ${process.cwd()}/node_modules.\n` +
      'Run lint from a repo root that has it, or install it there: ' +
      'npm install --save-dev playwright && npx playwright install chromium');
    process.exit(2);
  }
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  const usesTailwindBrowser = await page.evaluate(() =>
    [...document.scripts].some(s => /@tailwindcss\/browser/.test(s.src)));
  if(usesTailwindBrowser) {
    // the probe stays in the DOM while polling so Tailwind's
    // MutationObserver can see it and generate `.hidden`
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.id = 'vellum-lint-probe';
      probe.className = 'hidden';
      document.body.appendChild(probe);
    });
    await page.waitForFunction(() => getComputedStyle(
      document.getElementById('vellum-lint-probe')).display === 'none',
    null, {timeout: 15000}).catch(e => {
      throw new Error(
        `Tailwind browser CDN did not apply styles within 15s: ${e.message}`);
    });
    await page.evaluate(() =>
      document.getElementById('vellum-lint-probe').remove());
  }
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))));
}

function measure() {
  const HEADING_SEL = 'h1,h2,h3,h4,h5,h6,legend,[data-slot=card-title],' +
    '[data-slot=field-legend]';
  const CONTROL_SEL = 'input,select,textarea,button,a[href],[role=tab],' +
    '[role=checkbox],[role=switch],[role=radio],[data-slot=switch],' +
    '[data-slot=select-trigger]';
  const findings = [];
  const add = (rule, level, px, detail) =>
    findings.push({rule, level, px, detail});

  const rect = el => el.getBoundingClientRect();
  const visible = el => {
    if(!el.getClientRects().length) {
      return false;
    }
    const r = rect(el);
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' &&
      Number(cs.opacity) > 0;
  };
  const describe = el => {
    const slot = el.dataset?.slot ? `[${el.dataset.slot}]` : '';
    const id = el.id ? `#${el.id}` : '';
    const text = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ');
    const short = text.length > 32 ? text.slice(0, 31) + '…' : text;
    return `${el.tagName.toLowerCase()}${id}${slot}${short ? ` "${short}"` : ''}`;
  };
  const round = n => Math.round(n * 10) / 10;
  const overlapX = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const overlapY = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  const ownText = el => [...el.childNodes].some(n =>
    n.nodeType === 3 && n.textContent.trim());

  const all = [...document.body.querySelectorAll('*')]
    .filter(el => !['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'].includes(el.tagName))
    .filter(visible);

  const MEDIA = ['IMG', 'svg', 'CANVAS', 'VIDEO'];
  if(!ownText(document.body) && !all.some(el => ownText(el) ||
    el.matches(CONTROL_SEL) || MEDIA.includes(el.tagName))) {
    add('empty-page', 'FAIL', '-',
      `${all.length} visible elements, none with content`);
  }

  const vw = window.innerWidth;
  const sw = document.documentElement.scrollWidth;
  if(sw > vw) {
    const over = all
      .filter(el => rect(el).right > vw + 0.5)
      .sort((a, b) => rect(b).right - rect(a).right)
      .slice(0, 3)
      .map(el => `${describe(el)} right=${round(rect(el).right)}`);
    add('h-scroll', 'FAIL', `${sw} > ${vw}`, over.join('; ') || 'no element found');
  }

  const aloneOnLine = el => {
    const r = rect(el);
    let node = el;
    while(node.parentElement && node.parentElement !== document.body) {
      const siblings = [...node.parentElement.children]
        .filter(c => c !== node && visible(c));
      if(siblings.length) {
        return siblings.every(c => overlapY(rect(c), r) <= 1);
      }
      node = node.parentElement;
    }
    return true;
  };
  const isHeading = el => {
    if(el.matches(HEADING_SEL)) {
      return true;
    }
    if(!ownText(el) || el.matches(CONTROL_SEL) || el.closest(CONTROL_SEL) ||
      el.querySelector(CONTROL_SEL) || el.closest('label')) {
      return false;
    }
    return Number(getComputedStyle(el).fontWeight) >= 600 && aloneOnLine(el);
  };
  const border = el => {
    const cs = getComputedStyle(el);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].every(s =>
      parseFloat(cs[`border${s}Width`]) > 0 &&
      cs[`border${s}Style`] !== 'none' &&
      !/rgba\([^)]*,\s*0\)|transparent/.test(cs[`border${s}Color`]));
    const ring = cs.boxShadow !== 'none' &&
      /0px 0px 0px [1-9]/.test(cs.boxShadow);
    return sides || ring;
  };

  const headingEls = new Set();
  const items = [];
  for(const el of all) {
    if(items.length && items[items.length - 1].el.contains(el) &&
      items[items.length - 1].kind === 'heading') {
      continue;
    }
    if(isHeading(el)) {
      headingEls.add(el);
      items.push({el, kind: 'heading'});
      continue;
    }
    const content = el.matches(CONTROL_SEL) || ownText(el) ||
      ['IMG', 'svg', 'PRE', 'TABLE', 'HR'].includes(el.tagName) || border(el);
    if(content) {
      items.push({el, kind: 'content'});
    }
  }
  const reported = new Set();
  for(let i = 0; i < items.length; i++) {
    if(items[i].kind !== 'heading' || reported.has(items[i].el)) {
      continue;
    }
    const chain = [items[i].el];
    let last = rect(items[i].el);
    for(let j = i + 1; j < items.length; j++) {
      const {el, kind} = items[j];
      if(chain.some(h => h.contains(el))) {
        continue;
      }
      const r = rect(el);
      if(overlapX(r, last) <= 0 || r.top < last.bottom - 2) {
        continue;
      }
      if(kind !== 'heading') {
        break;
      }
      chain.push(el);
      last = r;
    }
    if(chain.length >= 3) {
      chain.forEach(h => reported.add(h));
      const span = rect(chain[chain.length - 1]).bottom - rect(chain[0]).top;
      add('heading-stack', 'FAIL', `${round(span)} tall`,
        chain.map(describe).join(' > '));
    }
  }

  const isField = el => el.matches('[data-slot=field]') ||
    (!el.querySelector('[data-slot=field]') &&
      [...el.children].some(c => c.matches('label,[data-slot=field-label]')) &&
      !!el.querySelector('input,select,textarea,[data-slot=select-trigger],' +
        '[data-slot=switch],[role=group]'));
  const headingIn = el => el && (headingEls.has(el) ||
    [...el.children].some(c => headingEls.has(c)));
  const isSection = el => el.matches('section,fieldset,[data-slot=field-set]') ||
    headingIn(el.firstElementChild);
  const stackedGaps = parent => {
    const kids = [...parent.children].filter(visible)
      .filter(c => getComputedStyle(c).position !== 'absolute' &&
        getComputedStyle(c).position !== 'fixed')
      .sort((a, b) => rect(a).top - rect(b).top);
    const gaps = [];
    for(let i = 1; i < kids.length; i++) {
      const a = rect(kids[i - 1]);
      const b = rect(kids[i]);
      if(overlapX(a, b) > 0 && b.top >= a.bottom - 0.5) {
        gaps.push({a: kids[i - 1], b: kids[i], gap: b.top - a.bottom});
      }
    }
    return gaps;
  };
  const fieldGapsCache = new Map();
  const maxFieldGap = root => {
    if(fieldGapsCache.has(root)) {
      return fieldGapsCache.get(root);
    }
    let best = null;
    for(const parent of [root, ...root.querySelectorAll('*')].filter(visible)) {
      for(const g of stackedGaps(parent)) {
        if(isField(g.a) && isField(g.b) && (!best || g.gap > best.gap)) {
          best = g;
        }
      }
    }
    fieldGapsCache.set(root, best);
    return best;
  };
  for(const parent of all) {
    for(const g of stackedGaps(parent)) {
      const aS = isSection(g.a);
      const bS = isSection(g.b);
      if(!(aS || bS) || !((aS || isField(g.a)) && (bS || isField(g.b)))) {
        continue;
      }
      const inner = [maxFieldGap(g.a), maxFieldGap(g.b)]
        .filter(Boolean).sort((x, y) => y.gap - x.gap)[0];
      if(inner && g.gap <= inner.gap + 0.5) {
        add('gap-order', 'FAIL',
          `section ${round(g.gap)} <= field ${round(inner.gap)}`,
          `between ${describe(g.a)} and ${describe(g.b)}; ` +
          `field gap between ${describe(inner.a)} and ${describe(inner.b)}`);
      }
    }
  }

  const pinned = el => {
    for(let n = el; n; n = n.parentElement) {
      if(['fixed', 'sticky'].includes(getComputedStyle(n).position)) {
        return true;
      }
    }
    return false;
  };
  const boxes = all.filter(el => border(el) && !pinned(el));
  for(let i = 0; i < boxes.length; i++) {
    for(let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if(a.contains(b) || b.contains(a)) {
        continue;
      }
      const ra = rect(a);
      const rb = rect(b);
      const minW = Math.min(ra.width, rb.width);
      const minH = Math.min(ra.height, rb.height);
      let gap = null;
      if(overlapX(ra, rb) >= Math.min(8, minW / 2)) {
        gap = Math.max(rb.top - ra.bottom, ra.top - rb.bottom);
      } else if(overlapY(ra, rb) >= Math.min(8, minH / 2)) {
        gap = Math.max(rb.left - ra.right, ra.left - rb.right);
      }
      if(gap !== null && gap > 0.5 && gap < 8) {
        add('box-smash', 'FAIL', `${round(gap)}`,
          `${describe(a)} and ${describe(b)}`);
      }
    }
  }

  const fields = all.filter(el => el.matches('[data-slot=field]'));
  if(fields.length) {
    const helped = fields.filter(f => {
      if([...f.querySelectorAll('[data-slot=field-description]')].some(visible)) {
        return true;
      }
      const label = f.querySelector('[data-slot=field-label],label') ||
        (f.matches('label') ? f : null);
      if(!label) {
        return false;
      }
      const labelColor = getComputedStyle(label).color;
      const labelBottom = rect(label).bottom;
      return [...f.querySelectorAll('p')].some(p => visible(p) &&
        rect(p).top >= labelBottom - 1 &&
        getComputedStyle(p).color !== labelColor);
    });
    if(helped.length * 3 > fields.length) {
      add('helper-ratio', 'WARN', `${helped.length}/${fields.length}`,
        helped.map(describe).join('; '));
    }
  }

  const alignBox = col => {
    if(col.getAttribute('aria-hidden') === 'true') {
      return null;
    }
    return [col, ...col.querySelectorAll('*')].find(el => visible(el) &&
      border(el) && !el.matches('button,a,[role=tab]') &&
      rect(el).width >= 24 && rect(el).height >= 24) || null;
  };
  for(const row of all) {
    const cs = getComputedStyle(row);
    const isRow = cs.display.includes('grid') ||
      (cs.display.includes('flex') && cs.flexDirection.startsWith('row'));
    if(!isRow) {
      continue;
    }
    const kids = [...row.children].filter(visible)
      .filter(c => !['absolute', 'fixed'].includes(getComputedStyle(c).position));
    if(kids.length < 2) {
      continue;
    }
    const top = Math.min(...kids.map(k => rect(k).top));
    const firstRow = kids.filter(k => rect(k).top < top + 1)
      .sort((a, b) => rect(a).left - rect(b).left);
    const cols = firstRow.filter((k, i) =>
      i === 0 || overlapX(rect(firstRow[i - 1]), rect(k)) <= 0);
    if(cols.length < 2) {
      continue;
    }
    const firsts = cols.map(c => ({col: c, box: alignBox(c)}))
      .filter(x => x.box);
    if(firsts.length < 2) {
      continue;
    }
    const tops = firsts.map(x => rect(x.box).top);
    const spread = Math.max(...tops) - Math.min(...tops);
    if(spread > 4) {
      add('column-align', 'WARN', `${round(spread)}`,
        `in ${describe(row)}: ` + firsts.map(x =>
          `${describe(x.box)} top=${round(rect(x.box).top)}`).join('; '));
    }
  }

  return findings;
}

async function main() {
  const {file, widths, shots} = parseArgs(process.argv);
  if(shots) {
    mkdirSync(shots, {recursive: true});
  }
  const {chromium} = loadPlaywright();
  const browser = await chromium.launch().catch(e => {
    console.error(`lint: chromium failed to launch. ` +
      `Run "npx playwright install chromium" in ${process.cwd()}.\n${e.message}`);
    process.exit(2);
  });
  const rows = [];
  try {
    for(const width of widths) {
      const page = await browser.newPage({viewport: {width, height: 900}});
      page.on('pageerror', e => rows.push({width, rule: 'page-error',
        level: 'FAIL', px: '-', detail: e.message}));
      page.on('requestfailed', r => rows.push({width, rule: 'load',
        level: 'FAIL', px: '-',
        detail: `${r.url()} ${r.failure()?.errorText ?? ''}`}));
      await page.goto(pathToFileURL(file).href,
        {waitUntil: 'networkidle', timeout: 30000});
      await settle(page);
      for(const f of await page.evaluate(measure)) {
        rows.push({width, ...f});
      }
      if(shots) {
        await page.screenshot({fullPage: true, path: path.join(shots,
          `${path.basename(file, '.html')}-${width}.png`)});
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`vellum lint: ${file}`);
  if(shots) {
    console.log(`shots: ${widths.map(w => path.join(shots,
      `${path.basename(file, '.html')}-${w}.png`)).join(', ')}`);
  }
  console.log('rules:');
  for(const [name, level, text] of RULES) {
    console.log(`  ${name} (${level}): ${text}`);
  }
  console.log('');
  if(!rows.length) {
    console.log(`PASS at ${widths.join(', ')}px: no findings`);
    return 0;
  }
  const head = {width: 'width', level: 'level', rule: 'rule', px: 'px',
    detail: 'elements'};
  const cols = ['width', 'level', 'rule', 'px'];
  const size = Object.fromEntries(cols.map(c =>
    [c, Math.max(...[head, ...rows].map(r => String(r[c]).length))]));
  const line = r => cols.map(c => String(r[c]).padEnd(size[c])).join('  ') +
    '  ' + r.detail;
  console.log(line(head));
  for(const r of rows) {
    console.log(line(r));
  }
  const fails = rows.filter(r => r.level === 'FAIL').length;
  console.log(`\n${fails} fail, ${rows.length - fails} warn`);
  return fails ? 1 : 0;
}

main().then(code => process.exit(code), e => {
  console.error(`lint: ${e.stack || e.message}`);
  process.exit(2);
});
