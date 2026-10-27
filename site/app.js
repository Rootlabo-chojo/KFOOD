(() => {
  const body = document.body

  // ---------- mobile sidebar ----------
  const menuBtn = document.querySelector('.menu-btn')
  const scrim = document.querySelector('.scrim')
  const setNav = (open) => {
    body.classList.toggle('nav-open', open)
    menuBtn.setAttribute('aria-expanded', String(open))
    scrim.hidden = !open
  }
  menuBtn.addEventListener('click', () => setNav(!body.classList.contains('nav-open')))
  scrim.addEventListener('click', () => setNav(false))

  // ---------- collapsible nav groups ----------
  document.querySelectorAll('.nav-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const li = btn.closest('li')
      const open = li.classList.toggle('open')
      btn.setAttribute('aria-expanded', String(open))
    })
  })
  const active = document.querySelector('.nav-link.active')
  if (active) active.scrollIntoView({ block: 'center' })

  // ---------- "on this page" highlight ----------
  const tocLinks = [...document.querySelectorAll('.toc a')]
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const headings = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean)
    const visible = new Set()
    const update = () => {
      const current = headings.find((h) => visible.has(h)) || null
      tocLinks.forEach((a) => a.classList.toggle('current', current && a.hash.slice(1) === encodeURIComponent(current.id)))
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
        update()
      },
      { rootMargin: '-60px 0px -65% 0px' },
    )
    headings.forEach((h) => io.observe(h))
  }

  // ---------- search ----------
  const dialog = document.querySelector('.search')
  const input = dialog.querySelector('input')
  const results = dialog.querySelector('.search-results')
  let index = null
  let selected = 0

  const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const highlight = (text, terms) => {
    let html = escapeHtml(text)
    for (const t of terms) {
      const re = new RegExp(escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      html = html.replace(re, (m) => `<mark>${m}</mark>`)
    }
    return html
  }
  const snippet = (text, term) => {
    const i = text.toLowerCase().indexOf(term)
    if (i < 0) return text.slice(0, 110)
    const start = Math.max(0, i - 40)
    return (start > 0 ? '… ' : '') + text.slice(start, start + 130) + (start + 130 < text.length ? ' …' : '')
  }

  const loadIndex = async () => {
    if (!index) index = await fetch('/search-index.json').then((r) => r.json())
    return index
  }

  const render = async () => {
    const q = input.value.trim().toLowerCase()
    if (!q) {
      results.innerHTML = ''
      return
    }
    const terms = q.split(/\s+/).filter(Boolean)
    const docs = await loadIndex()
    const scored = []
    for (const d of docs) {
      const title = d.t.toLowerCase()
      const text = (d.d + ' ' + d.x).toLowerCase()
      let score = 0
      let ok = true
      for (const t of terms) {
        const inTitle = title.includes(t)
        const inText = text.includes(t)
        if (!inTitle && !inText) {
          ok = false
          break
        }
        score += (inTitle ? 10 : 0) + (inText ? 1 : 0)
      }
      if (ok) scored.push({ d, score })
    }
    scored.sort((a, b) => b.score - a.score)
    selected = 0
    if (!scored.length) {
      results.innerHTML = `<li class="search-empty">‘${escapeHtml(input.value.trim())}’에 대한 검색 결과가 없습니다.</li>`
      return
    }
    results.innerHTML = scored
      .slice(0, 30)
      .map(
        ({ d }, i) =>
          `<li><a href="${d.u}"${i === 0 ? ' class="selected"' : ''}><span class="sr-section">${escapeHtml(d.s || '')}</span><span class="sr-title">${highlight(d.t, terms)}</span><span class="sr-snippet">${highlight(snippet(d.d + ' ' + d.x, terms[0]), terms)}</span></a></li>`,
      )
      .join('')
  }

  const openSearch = () => {
    dialog.hidden = false
    input.focus()
    input.select()
    loadIndex()
  }
  const closeSearch = () => {
    dialog.hidden = true
  }

  document.querySelector('.search-btn').addEventListener('click', openSearch)
  dialog.addEventListener('click', (e) => e.target === dialog && closeSearch())
  input.addEventListener('input', render)
  input.addEventListener('keydown', (e) => {
    const links = [...results.querySelectorAll('a')]
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!links.length) return
      e.preventDefault()
      selected = (selected + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length
      links.forEach((a, i) => a.classList.toggle('selected', i === selected))
      links[selected].scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' && links[selected]) {
      e.preventDefault()
      location.href = links[selected].href
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!dialog.hidden) closeSearch()
      else setNav(false)
    } else if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && dialog.hidden) {
      const tag = document.activeElement && document.activeElement.tagName
      if (e.key === '/' && (tag === 'INPUT' || tag === 'TEXTAREA')) return
      e.preventDefault()
      openSearch()
    }
  })
})()
