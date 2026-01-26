const form = document.getElementById('searchForm')
const input = document.getElementById('q')
const results = document.getElementById('results')
const tabButtons = document.querySelectorAll('.tabs button')
const tabsBar = document.querySelector('.tabs')
const topBar = document.getElementById('top')

let allData = []
let currentTab = 'all'
let snippetCache = {}
let fuse
let titles = []

const autocompleteBox = document.createElement('div')
autocompleteBox.className = 'autocomplete'
input.parentNode.appendChild(autocompleteBox)

const lightbox = document.createElement('div')
lightbox.className = 'lightbox'
lightbox.innerHTML = '<img>'
document.body.appendChild(lightbox)
lightbox.onclick = ()=>lightbox.classList.remove('active')

const videoModal = document.createElement('div')
videoModal.className = 'lightbox'
document.body.appendChild(videoModal)

videoModal.onclick = ()=>{
  const v = videoModal.querySelector('video')
  if(v){
    v.pause()
    v.remove()
  }
  videoModal.classList.remove('active')
}

const synonyms = {
  pics:'images', pictures:'images', photos:'images',
  videos:'video', clips:'video',
  games:'game'
}

function normalizeQuery(q){
  return q.toLowerCase().split(/\s+/).map(w=>synonyms[w]||w).join(' ')
}

function isQuestion(q){
  return /^(what|who|where|when|why|how)\b/i.test(q)
}

async function safeJSON(path){
  try{
    const r = await fetch(path)
    if(!r.ok) return null
    return await r.json()
  }catch{
    return null
  }
}

async function extractSusiImage(article){
  try{
    const res = await fetch(`susipedia/articles/content/${article.file}`)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html,'text/html')
    const img = doc.querySelector('.infobox img') || doc.querySelector('.thumb img')
    if(!img) return null
    return new URL(img.getAttribute('src'), res.url).href
  }catch{
    return null
  }
}

async function extractSnippet(url,q){
  if(snippetCache[url]) return snippetCache[url]
  if(url.endsWith('.mp4')) return ''
  try{
    const res = await fetch(url)
    if(!res.ok) return ''
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html,'text/html')
    doc.querySelectorAll('script,style,nav,footer,header').forEach(e=>e.remove())
    const meta = doc.querySelector('meta[name="description"]')
    if(meta){
      snippetCache[url] = meta.content
      return meta.content
    }
    const text = doc.body.innerText.replace(/\s+/g,' ').trim()
    const i = text.toLowerCase().indexOf(q.toLowerCase())
    const snippet = i === -1
      ? text.slice(0,160)+'…'
      : '…'+text.slice(Math.max(0,i-60),Math.min(text.length,i+100))+'…'
    snippetCache[url] = snippet
    return snippet
  }catch{
    return ''
  }
}

function setupFuse(){
  fuse = new Fuse(allData,{
    keys:['title'],
    threshold:0.35,
    ignoreLocation:true
  })
}

function activateResults(){
  topBar.classList.remove('home')
  tabsBar.classList.remove('hidden')
}

function runSearch(){
  const q = input.value.trim()
  if(!q) return
  history.replaceState(null,'',`?q=${encodeURIComponent(q)}`)
  activateResults()
  render(q)
}

function showDidYouMean(q){
  const r = fuse.search(q)[0]
  if(!r) return
  if(r.item.title.toLowerCase() === q.toLowerCase()) return
  const div = document.createElement('div')
  div.className = 'did-you-mean'
  div.innerHTML = `Did you mean <a href="#">${r.item.title}</a>?`
  div.querySelector('a').onclick = e=>{
    e.preventDefault()
    input.value = r.item.title
    runSearch()
  }
  results.appendChild(div)
}

function getSiteInfo(url){
  try{
    const u = new URL(url, location.origin)
    return { host:u.host, favicon:`${u.origin}/favicon.ico` }
  }catch{
    return { host:'', favicon:'/favicon.ico' }
  }
}

function render(q){
  q = normalizeQuery(q)
  results.innerHTML = ''

  let filtered = fuse.search(q).map(r=>r.item)

  if(currentTab==='images'){
    filtered = filtered.filter(d=>d.image || d.video)
  }else if(currentTab!=='all'){
    filtered = filtered.filter(d=>d.type===currentTab)
  }

  if(isQuestion(q)){
    filtered.sort((a,b)=>{
      if(a.url.includes('susipedia') && !b.url.includes('susipedia')) return -1
      return 0
    })
  }

  if(!filtered.length){
    showDidYouMean(q)
    return
  }

  if(currentTab==='images'){
    const grid = document.createElement('div')
    grid.className = 'image-grid'

    filtered.forEach(d=>{
      const a = document.createElement('a')
      a.href = d.url

      if(d.image){
        a.innerHTML = `<img src="${d.image}" loading="lazy">`
        a.onclick = e=>{
          e.preventDefault()
          lightbox.querySelector('img').src = d.image
          lightbox.classList.add('active')
        }
      }else if(d.video){
        a.innerHTML = `
          <div style="position:relative">
            <video class="video-thumb" muted preload="metadata" playsinline>
              <source src="${d.video}" type="video/mp4">
            </video>
            <span class="duration"></span>
          </div>
        `
        const v = a.querySelector('video')
        const dur = a.querySelector('.duration')

        v.addEventListener('loadedmetadata',()=>{
          v.currentTime = 0.1
          const m = Math.floor(v.duration/60)
          const s = Math.floor(v.duration%60).toString().padStart(2,'0')
          dur.textContent = `${m}:${s}`
        })

        a.onmouseenter = ()=>v.play()
        a.onmouseleave = ()=>{
          v.pause()
          v.currentTime = 0.1
        }

        a.onclick = e=>{
          e.preventDefault()
          videoModal.innerHTML = `
            <video controls autoplay playsinline>
              <source src="${d.video}" type="video/mp4">
            </video>
          `
          videoModal.classList.add('active')

        }
      }

      grid.appendChild(a)
    })

    results.appendChild(grid)
    return
  }

  filtered.forEach(d=>{
    const div = document.createElement('div')
    div.className = 'result'
    const site = getSiteInfo(d.url)

    if(currentTab==='videos' && d.video){
      div.innerHTML = `
        <div style="display:flex;gap:14px">
          <div class="video-preview" style="flex-shrink:0;width:160px;position:relative">
            <video muted preload="metadata" playsinline
              style="width:100%;height:90px;object-fit:cover;border-radius:8px;background:#000">
              <source src="${d.video}" type="video/mp4">
            </video>
            <span class="duration"></span>
          </div>
          <div>
            <div class="url-line">
              <img src="${site.favicon}" onerror="this.style.display='none'">
              <span>${site.host}</span>
            </div>
            <a href="${d.url}">${d.title}</a>
            <div class="snippet">MP4 video</div>
          </div>
        </div>
      `

      const wrap = div.querySelector('.video-preview')
      const v = wrap.querySelector('video')
      const dur = wrap.querySelector('.duration')

      v.addEventListener('loadedmetadata',()=>{
        v.currentTime = 0.1
        const m = Math.floor(v.duration/60)
        const s = Math.floor(v.duration%60).toString().padStart(2,'0')
        dur.textContent = `${m}:${s}`
      })

      wrap.onmouseenter = ()=>v.play()
      wrap.onmouseleave = ()=>{
        v.pause()
        v.currentTime = 0.1
      }

      wrap.onclick = e=>{
        e.preventDefault()
        const mv = videoModal.querySelector('video')
        mv.src = d.video
        videoModal.classList.add('active')
      }

      results.appendChild(div)
      return
    }

    div.innerHTML = `
      <div class="url-line">
        <img src="${site.favicon}" onerror="this.style.display='none'">
        <span>${site.host}</span>
      </div>
      <a href="${d.url}">${d.title}</a>
      <div class="snippet">Loading…</div>
    `

    results.appendChild(div)

    extractSnippet(d.url,q).then(t=>{
      div.querySelector('.snippet').innerHTML =
        t.replace(new RegExp(`(${q})`,'gi'),'<strong>$1</strong>')
    })
  })
}

function updateAutocomplete(){
  const q = input.value.trim().toLowerCase()
  autocompleteBox.innerHTML = ''
  if(!q) return
  titles.filter(t=>t.startsWith(q)).slice(0,6).forEach(t=>{
    const d = document.createElement('div')
    d.textContent = t
    d.onclick = ()=>{
      input.value = t
      autocompleteBox.innerHTML = ''
      runSearch()
    }
    autocompleteBox.appendChild(d)
  })
}

input.addEventListener('input',updateAutocomplete)
document.addEventListener('click',()=>autocompleteBox.innerHTML='')

form.addEventListener('submit',e=>{
  e.preventDefault()
  runSearch()
})

tabButtons.forEach(b=>b.onclick=()=>{
  tabButtons.forEach(x=>x.classList.remove('active'))
  b.classList.add('active')
  currentTab = b.dataset.tab
  runSearch()
})

async function load(){
  const articles = await safeJSON('articles/index.json') || []
  const susipedia = await safeJSON('susipedia/articles/articles.json') || []
  const games = await safeJSON('games/index.json') || []
  const quizzes = await safeJSON('quizzes/index.json') || []
  const videoData = await safeJSON('tv/videos/index.json') || { videos: [] }
  const commercials = await safeJSON('tv/commercials/index.json') || []

  articles.forEach(a=>allData.push({
    type:'news',
    title:a.file.replace(/_/g,' ').replace('.html',''),
    url:`articles/${a.folder}/${a.file}`,
    image:`articles/${a.folder}/cover.webp`
  }))

  for(const s of susipedia){
    const img = await extractSusiImage(s)
    allData.push({
      type:'news',
      title:s.title || s.file.replace(/_/g,' ').replace('.html',''),
      url:`susipedia/articles/content/${s.file}`,
      image:img
    })
  }

  games.forEach(g=>allData.push({
    type:'all',
    title:g.file.replace(/_/g,' ').replace('.html',''),
    url:`games/${g.folder}/${g.file}`,
    image:`games/${g.folder}/cover.webp`
  }))

  quizzes.forEach(q=>allData.push({
    type:'all',
    title:q.file.replace(/_/g,' ').replace('.html',''),
    url:`quizzes/${q.folder}/${q.file}`,
    image:`quizzes/${q.folder}/cover.webp`
  }))

  videoData.videos.forEach(v=>allData.push({
    type:'videos',
    title:v.src.replace('.mp4',''),
    url:`tv/videos/${encodeURIComponent(v.src)}`,
    video:`tv/videos/${encodeURIComponent(v.src)}`
  }))

  commercials.forEach(name=>allData.push({
    type:'videos',
    title:String(name).replace('.mp4',''),
    url:`tv/commercials/${encodeURIComponent(name)}`,
    video:`tv/commercials/${encodeURIComponent(name)}`
  }))

  titles = allData.map(d=>d.title.toLowerCase()).sort()
  setupFuse()

  const params = new URLSearchParams(location.search)
  const q = params.get('q')
  if(q){
    input.value = q
    activateResults()
    render(q)
  }
}

load()
