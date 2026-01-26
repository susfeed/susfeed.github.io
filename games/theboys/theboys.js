const c=document.getElementById("c")
const x=c.getContext("2d")
const W=c.width,H=c.height
const FOV=420

let paused = false
let gameMode="infinite"
let lockedCharacter=null
let lockedTheme=null
let respawnFade = 0
let respawning = false

const coins = []
let coinCount = Number(localStorage.getItem("coins") || 0)

const RENDER_SCALE=0.75
const FIXED_FPS = 40
const FIXED_DT = 1000 / FIXED_FPS

let accumulator = 0
let lastTime = performance.now()

const rc=document.createElement("canvas")
rc.width=W*RENDER_SCALE
rc.height=H*RENDER_SCALE
const rx=rc.getContext("2d")

const gravity=0.9
const moveSpeed=0.75
const jumpPower=14
const maxJumps=2
const deathY=420

const CULL_BEHIND=700
const FOG_START=500
const FOG_END=1400

const camera={
x:0,y:-90,z:360,
yaw:0,pitch:0,
autoYaw:0,
autoPitch:0
}

const player={
x:0,y:0,z:0,
vx:0,vy:0,vz:0,
width:54,
height:48,
jumps:0,
grounded:false
}

const COIN_RADIUS = 18
const COIN_MAGNET_DIST = player.width

const keys={}
addEventListener("keydown",e=>{
if(e.code==="Space")e.preventDefault()
keys[e.key.toLowerCase()]=true
})
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false)

let drag=false,lx=0,ly=0
c.addEventListener("pointerdown",e=>{drag=true;lx=e.clientX;ly=e.clientY})
addEventListener("pointerup",()=>drag=false)
addEventListener("pointermove",e=>{
if(!drag)return
camera.yaw+=(e.clientX-lx)*0.004
camera.pitch+=(e.clientY-ly)*0.004
camera.pitch=Math.max(-1.2,Math.min(0.8,camera.pitch))
lx=e.clientX;ly=e.clientY
})

const themes=[
{
name:"HELL",
bg:"linear-gradient(#ff2400 0%,#9c0000 40%,#2a0000 75%,#000 100%)",
platform:()=>`rgb(255,${(40+Math.random()*180)|0},0)`,
sprite:"neil.png",
song:"songs/song.mp3"
},
{
name:"HEAVEN",
bg:"linear-gradient(#cbb7ff 0%,#ffffff 45%,#9fd6ff 100%)",
platform:()=>["#ababab","#c680ff","#0b0087"][(Math.random()*3)|0],
sprite:"cam.png",
song:"songs/song2.mp3"
},
{
name:"MESOPOTAMIA",
bg:"linear-gradient(#0f2d1a 0%,#1f5a2e 60%,#000 100%)",
platform:()=>["#6b4f2a","#9c8a5a","#888888"][(Math.random()*3)|0],
sprite:"smeff.png",
song:"songs/song3.mp3"
},
{
name:"THE WOODS",
bg:"linear-gradient(#ffb347 0%, #ff6f61 60%, #2c0f1a 100%)",
platform:()=>["#653900","#00921d","#6f4bff"][(Math.random()*3)|0],
sprite:"chip.png",
song:"songs/song4.mp3"
},
{
name:"UNIVERSAL",
bg:"linear-gradient(#ffb347 0%, #000000 60%, #320581 100%)",
platform:()=>["#ffd900","#ffffff","#3300ff"][(Math.random()*3)|0],
sprite:"sara.png",
song:"songs/song5.mp3"
},
{
name:"THE SERVER",
bg:"linear-gradient(#ffb347 0%, #000000 60%, #000000 100%)",
platform:()=>["#00ff4c","#009719","#004811"][(Math.random()*3)|0],
sprite:"phil.png",
song:"songs/song6.mp3"
},
{
name:"SUSFEED HQ",
bg:"linear-gradient(#ffb347 0%, #ffffff 60%, #ffffff 100%)",
platform:()=>["#ff0000","#970000","#480000"][(Math.random()*3)|0],
sprite:"red.png",
song:"songs/song7.mp3"
},
{
name:"DOJO",
bg:"linear-gradient(#ffb347 0%, #f6ff00 60%, #b97b00 100%)",
platform:()=>["#2b00ff","#00590f","#ff0000"][(Math.random()*3)|0],
sprite:"antonio.png",
song:"songs/s.mp3"
},
{
name:"CHUCK E CHEESE'S",
bg:"linear-gradient(#ffb347 0%, #ae00ff 60%, #63006e 100%)",
platform:()=>["#e100ff","#007c15","#e1ff00"][(Math.random()*3)|0],
sprite:"chog e choggers.png",
song:"songs/s2.mp3"
},
{
name:"OSAKA",
bg:"linear-gradient(#ffb347 0%, #5e66ff 60%, #0054a9 100%)",
platform:()=>["#ffffab","#8f8f8f","#f4ffa4"][(Math.random()*3)|0],
sprite:"takochan.png",
song:"songs/s3.mp3"
},
{
name:"OCTOPUS'S GARDEN",
bg:"linear-gradient(#ffb347 0%, #4e4e4e 60%, #919191 100%)",
platform:()=>["#fe5200","#551e0a","#fdef14"][(Math.random()*3)|0],
sprite:"ringo.png",
song:"songs/s4.mp3"
},
{
name:"RAX",
bg:"linear-gradient(#ffb347 0%, #62cbff 60%, #01ccff 100%)",
platform:()=>["#fe5200","#a75c16","#000000"][(Math.random()*3)|0],
sprite:"delicious.png",
song:"songs/s5.mp3"
},
{
name:"ROUTE 1",
bg:"linear-gradient(#ffb347 0%, #62cbff 60%, #ffffff 100%)",
platform:()=>["#00ff08","#00a205","#399b50"][(Math.random()*3)|0],
sprite:"furret.png",
song:"songs/s6.mp3"
}
]

let locationTimer = 0
let currentLocation = ""
let locationSlide = -40

function showLocation(name){
  currentLocation = name
  locationTimer = 120
  locationSlide = -40
}

let currentTheme=0
let platformCount=0

const img=new Image()
const audioA = new Audio()
const audioB = new Audio()
audioA.loop = audioB.loop = true

let activeAudio = audioA
let inactiveAudio = audioB

function crossFadeTo(src, duration=1200){
  inactiveAudio.src = src
  inactiveAudio.volume = 0
  inactiveAudio.play()

  const start = performance.now()

function fade(t){
  const p = Math.min(1, Math.max(0, (t - start) / duration))

  inactiveAudio.volume = p
  activeAudio.volume = 1 - p

  if(p < 1){
    requestAnimationFrame(fade)
  }else{
    activeAudio.pause()
    activeAudio.volume = 1
    inactiveAudio.volume = 1
    ;[activeAudio, inactiveAudio] = [inactiveAudio, activeAudio]
  }
}
  requestAnimationFrame(fade)
}

function applyTheme(i){
  currentTheme = i
  document.querySelector("canvas").style.background = themes[i].bg
  showLocation(themes[i].name)

  if(gameMode === "story"){
    activeAudio.pause()
    inactiveAudio.pause()
    activeAudio.src = themes[i].song
    activeAudio.currentTime = 0
    activeAudio.volume = 1
    activeAudio.play().catch(()=>{})
  }else{
    crossFadeTo(themes[i].song)
  }

  if(gameMode === "infinite") img.src = themes[i].sprite
}

function setCharacter(i){
  if(i === "custom"){
    const data = localStorage.getItem("customCharacter")
    if(data) img.src = data
    return
  }
  img.src = themes[i].sprite
}

function rotateY(p,a){
const s=Math.sin(a),c=Math.cos(a)
return{x:p.x*c-p.z*s,y:p.y,z:p.x*s+p.z*c}
}

function rotateX(p,a){
const s=Math.sin(a),c=Math.cos(a)
return{x:p.x,y:p.y*c-p.z*s,z:p.y*s+p.z*c}
}

function project(p){
let q={x:p.x-camera.x,y:p.y-camera.y,z:p.z-camera.z}
q=rotateY(q,-(camera.yaw+camera.autoYaw))
q=rotateX(q,-(camera.pitch+camera.autoPitch+0.18))
if(q.z>-5)return null
const z=-q.z
const s=FOV/z
return{x:q.x*s+rc.width/2,y:q.y*s+rc.height/2,z}
}

const platforms=[]
const faceBuffer=[]

function createPlatform(p,x,y,z){
p.x=x;p.y=y;p.z=z
p.y = Math.min(p.y, deathY - 120)
p.baseY = p.y
p.w=160;p.d=160;p.h=24
p.move=Math.random()<0.25?80:0
p.speed=0.02+Math.random()*0.015
p.phase=Math.random()*Math.PI*2
p.color=themes[currentTheme].platform()
platformCount++
if(gameMode==="infinite"){
const nextTheme=Math.min(themes.length-1,Math.floor(platformCount/100))
if(nextTheme!==currentTheme)applyTheme(nextTheme)
}
const special = Math.random() < 0.35
initPlatformTheme(p, currentTheme, special)
spawnCoinsForPlatform(p)
}

function spawnCoinsForPlatform(p){
  const count = (Math.random() * 3) | 0
  for(let i=0;i<count;i++){
    const y = p.y - 22
    coins.push({
      x: p.x + (Math.random()*2-1)*(p.w*0.35),
      y,
      baseY: y,
      z: p.z + (Math.random()*2-1)*(p.d*0.35),
      r: COIN_RADIUS,
      rot: Math.random()*Math.PI*2,
      bob: Math.random()*Math.PI*2,
      collected: false
    })
  }
}

function updateCoins(){
  for(const c of coins){
    if(c.collected) continue

    c.rot += 0.12
    c.bob += 0.08
    c.y = c.baseY + Math.sin(c.bob) * 6

    const dx = player.x - c.x
    const dy = (player.y - player.height*0.5) - c.y
    const dz = player.z - c.z
    const d = Math.hypot(dx,dy,dz)

    if(d < COIN_MAGNET_DIST){
      c.collected = true
      coinCount += (lockedCharacter === "custom" ? 2 : 1)
      localStorage.setItem("coins", coinCount)
    }
  }
}

function initPlatforms(){
platforms.length=0
coins.length = 0
platformCount=0
if(gameMode==="infinite"){
applyTheme(0)
}else{
applyTheme(lockedTheme)
setCharacter(lockedCharacter)
}
const p={}
createPlatform(p,0,0,0)
platforms.push(p)
player.x=0;player.y=0;player.z=0
}

function respawn(){
  respawning = true
  respawnFade = 0
}

function ensurePlatforms(){
const MIN_PLATFORM_Y = deathY - 120;
while(platforms.at(-1).z>player.z-1200){
const last=platforms.at(-1)
const p=platforms.length<50?{}:platforms.shift()
createPlatform(
  p,
  last.x + (Math.random()*2-1)*360,
  Math.min(
    MIN_PLATFORM_Y,
    last.y + Math.max(-60, Math.min(40, (Math.random()*2-1)*35))
  ),
  last.z - (210 + Math.random()*110)
)
platforms.push(p)
}
}

function findAheadPlatform(){
let best=null
let bestZ=-Infinity
for(const p of platforms){
if(p.z>=player.z)continue
const dz=player.z-p.z
if(dz>600)continue
if(best===null||p.z>bestZ){
bestZ=p.z
best=p
}
}
return best
}

const THEME_UNLOCK_STEP = 12500

function themeRequirement(i){
  if(i === 0) return 0
  return i * THEME_UNLOCK_STEP
}

function isThemeUnlocked(i){
  return best >= themeRequirement(i)
}

function updateThemeLocks(){
  document.querySelectorAll(".theme-btn").forEach(btn=>{
    const i = +btn.dataset.theme
    const req = themeRequirement(i)

    if(isThemeUnlocked(i)){
      btn.classList.remove("locked")
      btn.removeAttribute("data-req")
    }else{
      btn.classList.add("locked")
      btn.setAttribute("data-req", `REQ ${req}`)
    }
  })
}

function updateCameraAssist(){
const p=findAheadPlatform()
if(!p){
camera.autoYaw*=0.9
camera.autoPitch*=0.9
return
}
const dx=p.x-player.x
const dz=player.z-p.z
const rawYaw=Math.atan2(dx,dz)
const desiredYaw=Math.max(-0.35,Math.min(0.35,rawYaw*0.18))
const dy=(player.y-90)-p.y
const desiredPitch=Math.atan2(dy,Math.max(120,dz))*-0.25
camera.autoYaw+=(desiredYaw-camera.autoYaw)*0.035
camera.autoPitch+=(desiredPitch-camera.autoPitch)*0.03
camera.autoYaw=Math.max(-0.4,Math.min(0.4,camera.autoYaw))
camera.autoPitch=Math.max(-0.25,Math.min(0.25,camera.autoPitch))
}

function update(){
const dx=Math.sin(camera.yaw)
const dz=Math.cos(camera.yaw)

if(respawning){
  respawnFade += 0.04
  if(respawnFade >= 1){
    initPlatforms()
    player.vx = player.vy = player.vz = 0
    player.jumps = 0
    respawning = false
  }
  return
}

if(keys.w){player.vx+=dx*moveSpeed;player.vz-=dz*moveSpeed}
if(keys.s){player.vx-=dx*moveSpeed;player.vz+=dz*moveSpeed}
if(keys.a){player.vx-=dz*moveSpeed;player.vz-=dx*moveSpeed}
if(keys.d){player.vx+=dz*moveSpeed;player.vz+=dx*moveSpeed}

if(keys[" "]&&player.jumps<maxJumps){
player.vy=-jumpPower
player.jumps++
keys[" "]=false
}

player.vy+=gravity
player.vy=Math.min(player.vy,24)

player.x+=player.vx
player.y+=player.vy
player.z+=player.vz

player.vx*=0.82
player.vz*=0.82

player.grounded=false

for (const p of platforms) updatePlatformTheme(p)

for(const p of platforms){
const prevPx=p.x+(p.move?Math.sin(p.phase)*p.move:0)
p.phase+=p.speed
const px=p.x+(p.move?Math.sin(p.phase)*p.move:0)
if (
  p.active !== false &&
  Math.abs(player.x - px) < p.w / 2 &&
  Math.abs(player.z - p.z) < p.d / 2 &&
  player.vy >= 0 &&
  (
    (!p.upsideDown && player.y >= p.y && player.y <= p.y + p.h) ||
    (p.upsideDown && player.y <= p.y && player.y >= p.y - p.h)
  )
) {
  player.x += px - prevPx
  player.y = p.upsideDown ? p.y - player.height : p.y
  player.vy = 0
  player.grounded = true
  player.jumps = 0
  onPlatformLand(p, player)
}
}

if(player.y > deathY && !respawning) respawn()

camera.x=player.x
camera.y=player.y-90
camera.z=player.z+360

updateCameraAssist()
ensurePlatforms()
updateCoins()
}

function drawBox(p){
  if (p.active === false) return
  if (p.z > player.z + CULL_BEHIND) return

  const px = p.x + (p.move ? Math.sin(p.phase) * p.move : 0)
  const ry = p.rotY || 0
  const s = Math.sin(ry)
  const c = Math.cos(ry)

  function rot(v){
    const dx = v.x - px
    const dz = v.z - p.z
    return {
      x: px + dx * c - dz * s,
      y: v.y,
      z: p.z + dx * s + dz * c
    }
  }

  const x0 = px - p.w / 2
  const x1 = px + p.w / 2
  const z0 = p.z - p.d / 2
  const z1 = p.z + p.d / 2
  const y0 = p.y
  const y1 = p.y + p.h

  const faces = [
    [{x:x0,y:y1,z:z0},{x:x1,y:y1,z:z0},{x:x1,y:y1,z:z1},{x:x0,y:y1,z:z1}],
    [{x:x0,y:y0,z:z0},{x:x0,y:y1,z:z0},{x:x1,y:y1,z:z0},{x:x1,y:y0,z:z0}],
    [{x:x1,y:y0,z:z0},{x:x1,y:y1,z:z0},{x:x1,y:y1,z:z1},{x:x1,y:y0,z:z1}],
    [{x:x1,y:y0,z:z1},{x:x1,y:y1,z:z1},{x:x0,y:y1,z:z1},{x:x0,y:y0,z:z1}],
    [{x:x0,y:y0,z:z1},{x:x0,y:y1,z:z1},{x:x0,y:y1,z:z0},{x:x0,y:y0,z:z0}]
  ]

  for (const f of faces) {
    const pts = f.map(v => project(rot(v))).filter(Boolean)
    if (pts.length < 4) continue
    const depth = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) * 0.25
    faceBuffer.push({ pts, depth, color: p.color })
  }
}

function findShadowHit(){
let bestY=-Infinity
let hit=null
for(const p of platforms){
const px=p.x+(p.move?Math.sin(p.phase)*p.move:0)
if(p.y<player.y)continue
if(player.x<px-p.w/2||player.x>px+p.w/2)continue
if(player.z<p.z-p.d/2||player.z>p.z+p.d/2)continue
if(p.y>bestY){
bestY=p.y
hit={x:player.x,y:p.y,z:player.z}
}
}
return hit
}

function drawShadow(){
const hit=findShadowHit()
if(!hit)return
const proj=project({x:hit.x,y:hit.y+0.05,z:hit.z})
if(!proj)return
const h=player.y-hit.y
if(h>220)return
const radius=Math.max(4,15-h*0.09)
const alpha=Math.max(0.1,0.45-h*0.002)
rx.beginPath()
rx.ellipse(proj.x,proj.y,radius,radius*0.45,0,0,Math.PI*2)
rx.fillStyle=`rgba(0,0,0,${alpha})`
rx.fill()
}

function queuePlayer(){
  const foot = project({x:player.x,y:player.y,z:player.z})
  if(!foot) return

  const s = player.width * (FOV / foot.z)

  faceBuffer.push({
    sprite: true,
    depth: foot.z,
    x: foot.x - s/2,
    y: foot.y - s*(player.height/player.width),
    w: s,
    h: s*(player.height/player.width)
  })
}

function drawCoins(){
  for(const c of coins){
    if(c.collected) continue

    const p = project({x:c.x,y:c.y,z:c.z})
    if(!p) continue

    const s = c.r * (FOV / p.z)

    faceBuffer.push({
      coin:true,
      depth:p.z,
      x:p.x,
      y:p.y,
      s,
      rot:c.rot
    })
  }
}

function postProcess(){
x.clearRect(0,0,W,H)
x.imageSmoothingEnabled=false
x.drawImage(rc,-1,0,W,H)
x.globalAlpha=0.6
x.drawImage(rc,1,0,W,H)
x.globalAlpha=1
for(let y=0;y<H;y+=2){
x.fillStyle="rgba(0,0,0,0.08)"
x.fillRect(0,y,W,1)
}

if(respawnFade > 0){
  x.fillStyle = `rgba(0,0,0,${Math.min(respawnFade,1)})`
  x.fillRect(0,0,W,H)
  if(!respawning) respawnFade *= 0.85
}
}

let startZ=0
let best=Number(localStorage.getItem("best")||0)

function loop(t){
  if(paused){
    requestAnimationFrame(loop)
    return
  }

  let frameTime = t - lastTime
  if(frameTime > 100) frameTime = 100
  lastTime = t

  accumulator += frameTime

  while(accumulator >= FIXED_DT){
    update()
    accumulator -= FIXED_DT
  }

  rx.clearRect(0,0,rc.width,rc.height)
  faceBuffer.length = 0

  platforms.forEach(drawBox)
  queuePlayer()

  drawCoins()

faceBuffer
  .sort((a,b)=>b.depth-a.depth)
  .forEach(f=>{
    if(f.sprite){
      rx.globalAlpha = 1
      rx.drawImage(img, f.x, f.y, f.w, f.h)
      return
    }

if(f.coin){
  rx.save()
  rx.translate(f.x, f.y)

  const squash = Math.abs(Math.cos(f.rot))
  rx.scale(squash, 1)

  rx.beginPath()
  rx.arc(0, 0, f.s, 0, Math.PI*2)
  rx.fillStyle = "#ffd900"
  rx.fill()

  rx.lineWidth = Math.max(2, f.s*0.2)
  rx.strokeStyle = "#fff6a0"
  rx.stroke()

  rx.restore()
  return
}

    const fog = Math.min(1,Math.max(0,(f.depth-FOG_START)/(FOG_END-FOG_START)))
    const band = Math.floor(fog*4)/4
    rx.globalAlpha = 0.8 * (1 - band)

    rx.beginPath()
    f.pts.forEach((q,i)=>i?rx.lineTo(q.x,q.y):rx.moveTo(q.x,q.y))
    rx.closePath()
    rx.fillStyle = f.color
    rx.fill()
    rx.strokeStyle = "rgba(255,255,255,0.3)"
    rx.stroke()
  })

  rx.globalAlpha = 1
  drawShadow()
  postProcess()

  const dist = Math.max(0, Math.floor(startZ - player.z))
  best = Math.max(best, dist)
  localStorage.setItem("best", best)
  document.getElementById("dist").textContent = dist
  document.getElementById("best").textContent = best
  document.getElementById("coinHud").textContent = coinCount
  document.getElementById("coinTitle").textContent = coinCount

  requestAnimationFrame(loop)
}

document.querySelector(".start-btn").onclick=()=>{
document.getElementById("overlay").style.display="none"
initPlatforms()
startZ=player.z
activeAudio.currentTime = 0
activeAudio.volume = 1
activeAudio.play()
requestAnimationFrame(loop)
}

function pauseGame(){
  if(paused) return
  paused = true
  activeAudio.pause()
  document.getElementById("pauseMenu").style.display = "flex"
}

function resumeGame(){
  paused = false
  activeAudio.play()
  document.getElementById("pauseMenu").style.display = "none"
  lastTime = performance.now()
}

addEventListener("keydown", e=>{
  if(e.code==="Escape"){
    paused ? resumeGame() : pauseGame()
    return
  }
  if(paused) return

  if(e.code==="Space")e.preventDefault()
  keys[e.key.toLowerCase()] = true
})
