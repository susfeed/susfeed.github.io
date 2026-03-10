const colors=[
"#d8c6ff",
"#cfcfff",
"#b8ffe3",
"#c8ffd7",
"#fff7b8"
]

document.querySelectorAll(".project-btn").forEach(btn=>{
let c1=colors[Math.floor(Math.random()*colors.length)]
let c2=colors[Math.floor(Math.random()*colors.length)]
btn.style.background=`linear-gradient(135deg,${c1},${c2})`
})

const canvas=document.getElementById("particles")
const ctx=canvas.getContext("2d")

let particles=[]
let count=90

function resize(){
canvas.width=window.innerWidth
canvas.height=window.innerHeight
}

window.addEventListener("resize",resize)
resize()

for(let i=0;i<count;i++){
particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:(Math.random()-0.5)*0.6,
vy:(Math.random()-0.5)*0.6,
size:Math.random()*2+1
})
}

function draw(){
ctx.clearRect(0,0,canvas.width,canvas.height)

particles.forEach(p=>{
p.x+=p.vx
p.y+=p.vy

if(p.x<0||p.x>canvas.width)p.vx*=-1
if(p.y<0||p.y>canvas.height)p.vy*=-1

ctx.beginPath()
ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
ctx.fillStyle="rgba(255,255,255,0.8)"
ctx.fill()
})

for(let i=0;i<particles.length;i++){
for(let j=i+1;j<particles.length;j++){
let dx=particles[i].x-particles[j].x
let dy=particles[i].y-particles[j].y
let dist=Math.sqrt(dx*dx+dy*dy)

if(dist<120){
ctx.beginPath()
ctx.moveTo(particles[i].x,particles[i].y)
ctx.lineTo(particles[j].x,particles[j].y)
ctx.strokeStyle=`rgba(255,255,255,${1-dist/120})`
ctx.lineWidth=0.6
ctx.stroke()
}
}
}

requestAnimationFrame(draw)
}

draw()