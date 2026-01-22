const c=document.getElementById("c")
const x=c.getContext("2d")
const W=c.width,H=c.height
const FOV=420

const RENDER_SCALE=0.75
const FPS_CAP=20

let capFPS=false
let lastFrame=0

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

const keys={}
addEventListener("keydown",e=>{
if(e.code==="Space")e.preventDefault()
keys[e.key.toLowerCase()]=true
if(e.key==="f")capFPS=!capFPS
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
bg:"linear-gradient(#ff2400 0%,#9c0000 40%,#2a0000 75%,#000 100%)",
platform:()=>`rgb(255,${(40+Math.random()*180)|0},0)`,
sprite:"neil.png",
song:"song.mp3"
}
]

let currentTheme=0
let platformCount=0

const img=new Image()
const audio=new Audio()
audio.loop=true

function applyTheme(i){
currentTheme=i
document.querySelector("canvas").style.background=themes[i].bg
img.src=themes[i].sprite
audio.src=themes[i].song
audio.play()
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
p.w=160;p.d=160;p.h=24
p.move=Math.random()<0.25?80:0
p.speed=0.02+Math.random()*0.015
p.phase=Math.random()*Math.PI*2
p.color=themes[currentTheme].platform()
platformCount++
const nextTheme=Math.min(themes.length-1,Math.floor(platformCount/10))
if(nextTheme!==currentTheme)applyTheme(nextTheme)
}

function initPlatforms(){
platforms.length=0
platformCount=0
applyTheme(0)
const p={}
createPlatform(p,0,0,0)
platforms.push(p)
player.x=0;player.y=0;player.z=0
}

function respawn(){
initPlatforms()
player.vx=player.vy=player.vz=0
player.jumps=0
}

function ensurePlatforms(){
while(platforms.at(-1).z>player.z-1200){
const last=platforms.at(-1)
const p=platforms.length<50?{}:platforms.shift()
createPlatform(
p,
last.x+(Math.random()*2-1)*360,
last.y+Math.max(-60,Math.min(40,(Math.random()*2-1)*35)),
last.z-(210+Math.random()*110)
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

for(const p of platforms){
const prevPx=p.x+(p.move?Math.sin(p.phase)*p.move:0)
p.phase+=p.speed
const px=p.x+(p.move?Math.sin(p.phase)*p.move:0)
if(
Math.abs(player.x-px)<p.w/2 &&
Math.abs(player.z-p.z)<p.d/2 &&
player.y>=p.y &&
player.y<=p.y+p.h &&
player.vy>=0
){
player.x+=px-prevPx
player.y=p.y
player.vy=0
player.grounded=true
player.jumps=0
}
}

if(player.y>deathY)respawn()

camera.x=player.x
camera.y=player.y-90
camera.z=player.z+360

updateCameraAssist()
ensurePlatforms()
}

function drawBox(p){
if(p.z>player.z+CULL_BEHIND)return
const px=p.x+(p.move?Math.sin(p.phase)*p.move:0)
const x0=px-p.w/2,x1=px+p.w/2
const z0=p.z-p.d/2,z1=p.z+p.d/2
const y0=p.y,y1=p.y+p.h
const faces=[
[{x:x0,y:y1,z:z0},{x:x1,y:y1,z:z0},{x:x1,y:y1,z:z1},{x:x0,y:y1,z:z1}],
[{x:x0,y:y0,z:z0},{x:x0,y:y1,z:z0},{x:x1,y:y1,z:z0},{x:x1,y:y0,z:z0}],
[{x:x1,y:y0,z:z0},{x:x1,y:y1,z:z0},{x:x1,y:y1,z:z1},{x:x1,y:y0,z:z1}],
[{x:x1,y:y0,z:z1},{x:x1,y:y1,z:z1},{x:x0,y:y1,z:z1},{x:x0,y:y0,z:z1}],
[{x:x0,y:y0,z:z1},{x:x0,y:y1,z:z1},{x:x0,y:y1,z:z0},{x:x0,y:y0,z:z0}]
]
for(const f of faces){
const pts=f.map(project).filter(Boolean)
if(pts.length<4)continue
const depth=(pts[0].z+pts[1].z+pts[2].z+pts[3].z)*0.25
faceBuffer.push({pts,depth,color:p.color})
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

function drawPlayer(){
const foot=project({x:player.x,y:player.y,z:player.z})
if(!foot)return
const s=player.width*(FOV/foot.z)
rx.drawImage(img,foot.x-s/2,foot.y-s*(player.height/player.width),s,s*(player.height/player.width))
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
}

let startZ=0
let best=Number(localStorage.getItem("best")||0)

function loop(t){
if(capFPS&&t-lastFrame<1000/FPS_CAP){requestAnimationFrame(loop);return}
lastFrame=t

rx.clearRect(0,0,rc.width,rc.height)
faceBuffer.length=0
update()
platforms.forEach(drawBox)

faceBuffer.sort((a,b)=>b.depth-a.depth).forEach(f=>{
const fog=Math.min(1,Math.max(0,(f.depth-FOG_START)/(FOG_END-FOG_START)))
const band=Math.floor(fog*4)/4
rx.globalAlpha=0.8*(1-band)
rx.beginPath()
f.pts.forEach((q,i)=>i?rx.lineTo(q.x,q.y):rx.moveTo(q.x,q.y))
rx.closePath()
rx.fillStyle=f.color
rx.fill()
rx.strokeStyle="rgba(255,255,255,0.3)"
rx.stroke()
})
rx.globalAlpha=1

drawShadow()
drawPlayer()
postProcess()

const dist=Math.max(0,Math.floor(startZ-player.z))
best=Math.max(best,dist)
localStorage.setItem("best",best)
document.getElementById("hud").innerHTML=`DIST ${dist}<br>BEST ${best}`

requestAnimationFrame(loop)
}

document.querySelector(".start-btn").onclick=()=>{
document.getElementById("overlay").style.display="none"
initPlatforms()
startZ=player.z
audio.play()
requestAnimationFrame(loop)
}
