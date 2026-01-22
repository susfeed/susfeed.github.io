const c=document.getElementById("c")
const x=c.getContext("2d")
const W=c.width,H=c.height

const FOV=Math.PI/3
const RAYS=W
const MAX=48

let map=[],seen=[],MW,MH
let wallColor="#700"

const player={x:0,y:0,a:0,hp:100,r:.35}
let score=0
let running=false
let enemies=[]
let bullets=[]
let pickup=null
let fireCooldown=0
let bosses=[]

function genLevel(){
MW=30+Math.floor(Math.random()*6)
MH=22+Math.floor(Math.random()*6)
map=[]
seen=[]
for(let y=0;y<MH;y++){
map[y]=[]
seen[y]=[]
for(let x2=0;x2<MW;x2++){
map[y][x2]="#"
seen[y][x2]=false
}
}

const rooms=[]
const rc=5+Math.floor(Math.random()*2)

for(let i=0;i<rc;i++){
let w=8+Math.floor(Math.random()*6)
let h=8+Math.floor(Math.random()*6)
let rx=2+Math.floor(Math.random()*(MW-w-4))
let ry=2+Math.floor(Math.random()*(MH-h-4))
rooms.push({x:rx,y:ry,w,h})
for(let y=0;y<h;y++){
for(let x2=0;x2<w;x2++){
map[ry+y][rx+x2]="."
}
}
}

function carveH(x1,x2,y){
const s=Math.sign(x2-x1)
for(let x=x1;x!=x2;x+=s)map[y][x]="."
}

function carveV(y1,y2,x){
const s=Math.sign(y2-y1)
for(let y=y1;y!=y2;y+=s)map[y][x]="."
}

for(let i=1;i<rooms.length;i++){
const a=rooms[i-1]
const b=rooms[i]
const x1=a.x+(a.w>>1)
const y1=a.y+(a.h>>1)
const x2=b.x+(b.w>>1)
const y2=b.y+(b.h>>1)
carveH(x1,x2,y1)
carveV(y1,y2,x2)
if(Math.random()<.6){
carveV(y1,y2,x1)
carveH(x1,x2,y2)
}
}

for(let i=0;i<rooms.length;i++){
for(let j=i+1;j<rooms.length;j++){
if(Math.random()<.3){
const a=rooms[i]
const b=rooms[j]
const x1=a.x+(a.w>>1)
const y1=a.y+(a.h>>1)
const x2=b.x+(b.w>>1)
const y2=b.y+(b.h>>1)
carveH(x1,x2,y1)
carveV(y1,y2,x2)
}
}
}

wallColor=`hsl(${Math.random()*360},55%,38%)`
}

function randomFloor(){
let x2,y
do{
x2=Math.floor(Math.random()*MW)
y=Math.floor(Math.random()*MH)
}while(map[y][x2]!=".")
return{x:x2+.5,y:y+.5}
}

function spawnLevel(){
genLevel()
enemies=[]
bullets=[]
bosses=[]
const p=randomFloor()
player.x=p.x
player.y=p.y
player.a=0

const ec=6+Math.floor(Math.random()*3)
for(let i=0;i<ec;i++){
let e
do{
e=randomFloor()
}while(Math.hypot(e.x-player.x,e.y-player.y)<6)
enemies.push({x:e.x,y:e.y,a:0,hp:30,atk:0,alert:false,r:.35})
}

pickup={...randomFloor(),taken:false}
}

const keys={}
addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true)
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false)

const audio=new Audio("song.mp3")
audio.loop=true
audio.volume=.5

const img=new Image()
img.src="neil.png"

function wall(x,y){
return map[Math.floor(y)]?.[Math.floor(x)]=="#"
}

function norm(a){
while(a<-Math.PI)a+=Math.PI*2
while(a>Math.PI)a-=Math.PI*2
return a
}

function canSee(ax,ay,bx,by){
const d=Math.hypot(bx-ax,by-ay)
for(let t=0;t<d;t+=.2){
if(wall(ax+(bx-ax)*t/d,ay+(by-ay)*t/d))return false
}
return true
}

function shoot(){
if(fireCooldown>0)return
fireCooldown=12
bullets.push({x:player.x,y:player.y,a:player.a,t:30})
}

function pushApart(a,b){
const dx=a.x-b.x
const dy=a.y-b.y
const d=Math.hypot(dx,dy)
const m=a.r+b.r
if(d>0&&d<m){
const p=(m-d)/2
const nx=dx/d
const ny=dy/d
const ax=a.x+nx*p
const ay=a.y+ny*p
if(!wall(ax,a.y))a.x=ax
if(!wall(a.x,ay))a.y=ay
const bx=b.x-nx*p
const by=b.y-ny*p
if(!wall(bx,b.y))b.x=bx
if(!wall(b.x,by))b.y=by
}
}

function update(){
if(keys.a)player.a-=.05
if(keys.d)player.a+=.05

let sp=0
if(keys.w)sp=.06
if(keys.s)sp=-.04
if(sp){
const nx=player.x+Math.cos(player.a)*sp
const ny=player.y+Math.sin(player.a)*sp
if(!wall(nx,player.y))player.x=nx
if(!wall(player.x,ny))player.y=ny
}

if(keys.l)shoot()
if(fireCooldown>0)fireCooldown--

for(let y=0;y<MH;y++){
for(let x2=0;x2<MW;x2++){
if(Math.hypot(player.x-(x2+.5),player.y-(y+.5))<4)seen[y][x2]=true
}
}

for(const b of bullets){
b.x+=Math.cos(b.a)*.4
b.y+=Math.sin(b.a)*.4
b.t--
}
bullets=bullets.filter(b=>b.t>0&&!wall(b.x,b.y))

for(const e of enemies){
if(e.hp<=0)continue
const dx=player.x-e.x
const dy=player.y-e.y
const d=Math.hypot(dx,dy)
if(d<7&&canSee(e.x,e.y,player.x,player.y))e.alert=true
if(e.alert){
e.a=Math.atan2(dy,dx)
const nx=e.x+Math.cos(e.a)*.03
const ny=e.y+Math.sin(e.a)*.03
if(!wall(nx,e.y))e.x=nx
if(!wall(e.x,ny))e.y=ny
if(d<1.3&&e.atk<=0){
player.hp-=6
e.atk=45
}
}else e.a+=.02
if(e.atk>0)e.atk--
pushApart(e,player)
}

for(const b of bullets){
for(const e of enemies){
if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<.4){
e.hp-=15
b.t=0
if(e.hp<=0)score+=100
}
}
}

if(pickup&&!pickup.taken&&Math.hypot(player.x-pickup.x,player.y-pickup.y)<.6){
player.hp=Math.min(100,player.hp+35)
pickup.taken=true
}

if(enemies.every(e=>e.hp<=0))spawnLevel()
}

function drawCompass(){
const cx=W/2
const cy=H-50
const r=40
x.strokeStyle="#0ff"
x.beginPath()
x.arc(cx,cy,r,0,Math.PI*2)
x.stroke()
x.fillStyle="#0ff"
x.font="10px monospace"
const dirs=[{l:"N",a:-Math.PI/2},{l:"E",a:0},{l:"S",a:Math.PI/2},{l:"W",a:Math.PI}]
for(const d of dirs){
x.fillText(d.l,cx+Math.cos(d.a-player.a)*(r-10)-4,cy+Math.sin(d.a-player.a)*(r-10)+4)
}
x.strokeStyle="#fff"
x.beginPath()
x.moveTo(cx,cy)
x.lineTo(cx,cy-r)
x.stroke()
for(const e of enemies){
if(e.hp<=0)continue
const a=norm(Math.atan2(e.y-player.y,e.x-player.x)-player.a)
x.fillStyle="#f00"
x.fillRect(cx+Math.cos(a-Math.PI/2)*(r-6),cy+Math.sin(a-Math.PI/2)*(r-6),3,3)
}
for(const b of bosses){
const a=norm(Math.atan2(b.y-player.y,b.x-player.x)-player.a)
x.fillStyle="#a0f"
x.fillRect(cx+Math.cos(a-Math.PI/2)*(r-6),cy+Math.sin(a-Math.PI/2)*(r-6),4,4)
}
if(pickup&&!pickup.taken){
const a=norm(Math.atan2(pickup.y-player.y,pickup.x-player.x)-player.a)
x.fillStyle="#0f0"
x.fillRect(cx+Math.cos(a-Math.PI/2)*(r-6),cy+Math.sin(a-Math.PI/2)*(r-6),3,3)
}
}

function render(){
x.clearRect(0,0,W,H)
const zbuf=new Array(W)

for(let i=0;i<RAYS;i++){
const ra=player.a-FOV/2+FOV*i/RAYS
let d=0
while(d<MAX){
if(wall(player.x+Math.cos(ra)*d,player.y+Math.sin(ra)*d))break
d+=.03
}
d=Math.max(d,.2)
zbuf[i]=d
const h=H/(d*.6)
const shade=Math.max(0,170-d*5)
x.fillStyle=`rgb(${shade},0,0)`
x.fillRect(i,H/2-h/2,1,h)
}

for(const b of bullets){
const dx=b.x-player.x
const dy=b.y-player.y
const dist=Math.hypot(dx,dy)
const ang=norm(Math.atan2(dy,dx)-player.a)
if(Math.abs(ang)>FOV/2)continue
const sx=(ang/FOV+.5)*W
if(zbuf[Math.floor(sx)]<dist)continue
const s=H/(dist*5)
x.fillStyle="#ff0"
x.fillRect(sx-s/2,H/2-s/2,s,s)
}

for(const e of enemies){
if(e.hp<=0)continue
const dx=e.x-player.x
const dy=e.y-player.y
const dist=Math.hypot(dx,dy)
const ang=norm(Math.atan2(dy,dx)-player.a)
if(Math.abs(ang)>FOV/2)continue
const sx=(ang/FOV+.5)*W
if(zbuf[Math.floor(sx)]<dist)continue
const s=H/(dist*1.2)
x.drawImage(img,sx-s/2,H/2-s/2,s,s)
}

if(pickup&&!pickup.taken){
const dx=pickup.x-player.x
const dy=pickup.y-player.y
const dist=Math.hypot(dx,dy)
const ang=norm(Math.atan2(dy,dx)-player.a)
if(Math.abs(ang)<FOV/2){
const sx=(ang/FOV+.5)*W
if(zbuf[Math.floor(sx)]>=dist){
const s=H/(dist*3)
x.fillStyle="#0f0"
x.fillRect(sx-s/2,H/2-s/2,s,s)
}
}
}

x.strokeStyle="#0ff"
x.beginPath()
x.moveTo(W/2-6,H/2)
x.lineTo(W/2+6,H/2)
x.moveTo(W/2,H/2-6)
x.lineTo(W/2,H/2+6)
x.stroke()

const scale=4
const ox=10,oy=10
x.fillStyle="#000"
x.fillRect(ox,oy,MW*scale,MH*scale)

for(let y=0;y<MH;y++){
for(let x2=0;x2<MW;x2++){
if(seen[y][x2]){
x.fillStyle=map[y][x2]=="#"? "#222":"#444"
x.fillRect(ox+x2*scale,oy+y*scale,scale,scale)
}
}
}

x.fillStyle="#0ff"
x.fillRect(ox+player.x*scale,oy+player.y*scale,3,3)

for(const e of enemies){
if(e.hp>0){
x.fillStyle="#f00"
x.fillRect(ox+e.x*scale,oy+e.y*scale,3,3)
}
}

if(pickup&&!pickup.taken){
x.fillStyle="#0f0"
x.fillRect(ox+pickup.x*scale,oy+pickup.y*scale,3,3)
}

drawCompass()

document.getElementById("hp").style.width=player.hp+"%"
document.getElementById("score").textContent="SCORE "+score
document.getElementById("enemyCount").textContent="ENEMIES "+enemies.filter(e=>e.hp>0).length
}

function loop(){
if(!running)return
if(player.hp<=0){
x.fillStyle="#f00"
x.font="32px monospace"
x.fillText("YOU DIED",W/2-90,H/2)
return
}
update()
render()
requestAnimationFrame(loop)
}

document.getElementById("play").onclick=()=>{
document.getElementById("overlay").style.display="none"
audio.play()
spawnLevel()
running=true
loop()
}
