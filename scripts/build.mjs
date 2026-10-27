// Converts the GitBook-style markdown in this repository into a static website in dist/.
// Navigation comes from SUMMARY.md, images from .gitbook/assets.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { Marked, Renderer } from 'marked'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'dist')
const THEME = path.join(ROOT, 'site')
const SITE_NAME = 'KFOOD 가이드'

// ---------- helpers ----------

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const stripTags = (s) => s.replace(/<[^>]*>/g, '')

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

const isExternal = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')

// "culture/hqguide/README.md" -> "/culture/hqguide/", "faq.md" -> "/faq/"
function mdToUrl(file) {
  const noExt = file.replace(/\.md$/i, '')
  if (noExt === 'README') return '/'
  if (noExt.endsWith('/README')) return '/' + noExt.slice(0, -'README'.length)
  return '/' + noExt + '/'
}

const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/')

// Resolves a link/src found in `fromFile` to a site URL.
function resolveHref(fromFile, rawHref) {
  const href = decodeEntities(rawHref).trim()
  if (!href || href.startsWith('#') || isExternal(href) || href.startsWith('/')) return href
  const [pathPart, hash] = href.split('#')
  let decoded
  try {
    decoded = decodeURI(pathPart)
  } catch {
    decoded = pathPart
  }
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded))
  const suffix = hash ? '#' + hash : ''
  if (target.startsWith('.gitbook/assets/')) return '/assets/' + encodePath(target.slice('.gitbook/assets/'.length))
  if (/\.md$/i.test(target)) return mdToUrl(target) + suffix
  return '/' + encodePath(target) + suffix
}

function slugify(text, used) {
  let base =
    decodeEntities(stripTags(text))
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-') || 'section'
  let slug = base
  let i = 1
  while (used.has(slug)) slug = `${base}-${i++}`
  used.add(slug)
  return slug
}

// ---------- SUMMARY.md -> navigation tree ----------

function parseSummary() {
  const lines = fs.readFileSync(path.join(ROOT, 'SUMMARY.md'), 'utf8').split('\n')
  const sections = [{ title: '', items: [] }]
  const stack = []
  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/)
    if (heading) {
      sections.push({ title: stripTags(heading[1]).trim(), items: [] })
      stack.length = 0
      continue
    }
    const item = line.match(/^(\s*)[*-]\s+\[(.+?)\]\((.+?)\)\s*$/)
    if (!item) continue
    const depth = Math.floor(item[1].length / 2)
    const rawHref = item[3].replace(/\\&/g, '&')
    const external = isExternal(rawHref)
    const node = {
      title: item[2].trim(),
      file: external ? null : rawHref,
      href: external ? rawHref : mdToUrl(rawHref),
      external,
      children: [],
    }
    stack.length = depth
    const parent = stack[depth - 1]
    if (parent) parent.children.push(node)
    else sections[sections.length - 1].items.push(node)
    stack[depth] = node
  }
  return sections.filter((s) => s.items.length)
}

// ---------- markdown rendering ----------

function renderMarkdown(file, body) {
  const used = new Set()
  const toc = []
  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const id = slugify(html, used)
        if (depth === 2 || depth === 3 || depth === 4) toc.push({ depth, id, text: decodeEntities(stripTags(html)) })
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${html}</h${depth}>\n`
      },
      table(token) {
        // Wrap tables so they can scroll horizontally on small screens.
        return `<div class="table-wrap">${Renderer.prototype.table.call(this, token)}</div>\n`
      },
    },
  })

  const hintIcons = { info: 'ℹ️', warning: '⚠️', danger: '🚨', success: '✅' }
  const source = body
    // GitBook hint blocks -> callout divs (blank lines let markdown inside render).
    .replace(/\{%\s*hint\s+style="(\w+)"\s*%\}/g, (_, style) =>
      `<div class="hint hint-${style}"><span class="hint-icon">${hintIcons[style] || 'ℹ️'}</span><div class="hint-body">\n\n`)
    .replace(/\{%\s*endhint\s*%\}/g, '\n\n</div></div>')
    // Slack-style mentions like <@본사-조병조-CEO>
    .replace(/<@([^>\n]+)>/g, (_, name) => `<span class="mention">@${escapeHtml(name)}</span>`)
    // GitBook exports images inside lists as an empty bullet plus an indented <figure>,
    // which markdown would otherwise treat as a code block.
    .replace(/^[ \t]*[*-][ \t]*\n(?=\s*\n?[ \t]*<figure)/gm, '')
    .replace(/^[ \t]+(<figure)/gm, '$1')
    // Drop any other GitBook tags we don't support so they don't show up as raw text.
    .replace(/\{%[^%]*%\}/g, '')

  let html = marked.parse(source)
  html = html.replace(/\b(href|src)="([^"]*)"/g, (_, attr, value) => `${attr}="${escapeHtml(resolveHref(file, value))}"`)
  html = html.replace(/<a ((?:(?!target=)[^>])*?href="(?:https?:)?\/\/[^"]*"(?:(?!target=)[^>])*)>/g, '<a $1 target="_blank" rel="noopener">')
  html = html.replace(/<img /g, '<img loading="lazy" ')
  return { html, toc }
}

// ---------- page template ----------

function renderNav(sections, currentUrl) {
  const containsCurrent = (node) => node.href === currentUrl || node.children.some(containsCurrent)
  const renderItems = (items) =>
    items
      .map((node) => {
        const active = node.href === currentUrl
        const open = containsCurrent(node)
        const link = node.external
          ? `<a href="${escapeHtml(node.href)}" target="_blank" rel="noopener" class="nav-link external">${escapeHtml(node.title)}<span class="ext" aria-hidden="true">↗</span></a>`
          : `<a href="${node.href}" class="nav-link${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''}>${escapeHtml(node.title)}</a>`
        if (!node.children.length) return `<li>${link}</li>`
        return `<li class="has-children${open ? ' open' : ''}"><div class="nav-row">${link}<button class="nav-toggle" type="button" aria-label="하위 메뉴 펼치기" aria-expanded="${open}"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><ul>${renderItems(node.children)}</ul></li>`
      })
      .join('')
  return sections
    .map((s) => `<div class="nav-section">${s.title ? `<p class="nav-heading">${escapeHtml(s.title)}</p>` : ''}<ul>${renderItems(s.items)}</ul></div>`)
    .join('')
}

function layout({ title, description, content, toc = [], nav, prev, next, breadcrumb = [] }) {
  const tocHtml = toc.length
    ? `<aside class="toc" aria-label="이 페이지 목차"><p class="toc-title">이 페이지에서</p><ul>${toc
        .map((t) => `<li class="d${t.depth}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`)
        .join('')}</ul></aside>`
    : '<aside class="toc"></aside>'
  const pager =
    prev || next
      ? `<nav class="pager" aria-label="이전/다음 페이지">${
          prev ? `<a class="prev" href="${prev.href}"><span>이전</span><strong>${escapeHtml(prev.title)}</strong></a>` : '<span></span>'
        }${next ? `<a class="next" href="${next.href}"><span>다음</span><strong>${escapeHtml(next.title)}</strong></a>` : ''}</nav>`
      : ''
  const crumbs = breadcrumb.length
    ? `<p class="breadcrumb">${breadcrumb.map((b) => (b.href ? `<a href="${b.href}">${escapeHtml(b.title)}</a>` : escapeHtml(b.title))).join('<span>/</span>')}</p>`
    : ''
  const plainTitle = decodeEntities(stripTags(title))
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(plainTitle === SITE_NAME ? SITE_NAME : `${plainTitle} · ${SITE_NAME}`)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/_site/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍽️</text></svg>">
</head>
<body>
<header class="topbar">
  <button class="menu-btn" type="button" aria-label="메뉴 열기" aria-controls="sidebar" aria-expanded="false"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
  <a class="brand" href="/"><span class="brand-mark">K</span><span class="brand-text">KFOOD<small>Solution for Every Bite</small></span></a>
  <button class="search-btn" type="button" aria-label="검색"><svg viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>문서 검색</span><kbd>/</kbd></button>
</header>
<div class="shell">
  <nav id="sidebar" class="sidebar" aria-label="문서 목록">${nav}</nav>
  <div class="scrim" hidden></div>
  <main class="main">
    <article class="doc">
      ${crumbs}
      <header class="doc-head"><h1>${title}</h1>${description ? `<p class="lead">${escapeHtml(description)}</p>` : ''}</header>
      <div class="content">${content}</div>
      ${pager}
    </article>
    ${tocHtml}
  </main>
</div>
<div class="search" hidden role="dialog" aria-modal="true" aria-label="문서 검색">
  <div class="search-panel">
    <div class="search-field"><svg viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input type="search" placeholder="예: 연차, 영수증, 산재" autocomplete="off" aria-label="검색어"><kbd>Esc</kbd></div>
    <ul class="search-results"></ul>
  </div>
</div>
<script src="/_site/app.js" defer></script>
</body>
</html>
`
}

// ---------- build ----------

function walkMarkdown(dir, base = '') {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'scripts', 'site'].includes(entry.name)) continue
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...walkMarkdown(path.join(dir, entry.name), rel))
    else if (entry.name.endsWith('.md') && rel !== 'SUMMARY.md') out.push(rel)
  }
  return out
}

function writeFile(url, html) {
  const file = path.join(OUT, url.endsWith('/') ? url + 'index.html' : url)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })

  const sections = parseSummary()

  // Flattened reading order + breadcrumb info for every internal page in SUMMARY.md.
  const order = []
  const meta = new Map()
  const visit = (nodes, section, parents) => {
    for (const node of nodes) {
      if (!node.external) {
        order.push(node)
        meta.set(node.file, { title: node.title, section, parents })
      }
      visit(node.children, section, [...parents, node])
    }
  }
  for (const s of sections) visit(s.items, s.title, [])

  const files = walkMarkdown(ROOT)
  const searchIndex = []

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8')
    const { data, content: body } = matter(raw)
    const info = meta.get(file)

    // Use the page's own H1 as the title and render it in the header instead of the body.
    let title = info?.title || file
    const h1 = body.match(/^#\s+(.+)$/m)
    let rest = body
    if (h1) {
      title = h1[1].trim()
      rest = body.replace(h1[0], '')
    }
    const titleHtml = new Marked().parseInline(title)
    const description = typeof data.description === 'string' ? data.description.trim() : ''
    const { html, toc } = renderMarkdown(file, rest)

    const url = mdToUrl(file)
    const idx = order.findIndex((n) => n.file === file)
    const breadcrumb = info
      ? [...(info.section ? [{ title: info.section }] : []), ...info.parents.map((p) => ({ title: p.title, href: p.href }))]
      : []

    writeFile(
      url,
      layout({
        title: titleHtml,
        description,
        content: html,
        toc,
        nav: renderNav(sections, url),
        prev: idx > 0 ? order[idx - 1] : null,
        next: idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null,
        breadcrumb,
      }),
    )

    if (info) {
      searchIndex.push({
        t: decodeEntities(stripTags(titleHtml)),
        u: url,
        s: info.parents.length ? info.parents[info.parents.length - 1].title : info.section,
        d: description,
        x: decodeEntities(stripTags(html)).replace(/#(?=\S)/g, '').replace(/\s+/g, ' ').trim(),
      })
    }
  }

  writeFile(
    '/404.html',
    layout({
      title: '페이지를 찾을 수 없습니다',
      description: '주소가 바뀌었거나 삭제된 문서일 수 있습니다.',
      content: '<p><a href="/">홈으로 돌아가기</a> 또는 상단의 <strong>문서 검색</strong>으로 원하는 문서를 찾아보세요.</p>',
      nav: renderNav(sections, null),
    }),
  )

  fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(searchIndex))
  fs.cpSync(path.join(ROOT, '.gitbook', 'assets'), path.join(OUT, 'assets'), { recursive: true })
  fs.cpSync(THEME, path.join(OUT, '_site'), { recursive: true })

  console.log(`Built ${files.length} pages into dist/`)
}

build()
