const canvas=document.getElementById("particles")
const ctx=canvas.getContext("2d")

let particles=[]

function resize(){
canvas.width=window.innerWidth
canvas.height=window.innerHeight
}

window.addEventListener("resize",resize)
resize()

for(let i=0;i<120;i++){

particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:(Math.random()-.5)*0.4,
vy:(Math.random()-.5)*0.4,
size:Math.random()*2+1
})

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height)

for(const p of particles){

p.x+=p.vx
p.y+=p.vy

if(p.x<0||p.x>canvas.width)p.vx*=-1
if(p.y<0||p.y>canvas.height)p.vy*=-1

ctx.beginPath()
ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
ctx.fillStyle="rgba(199,125,255,.9)"
ctx.fill()

}

for(let i=0;i<particles.length;i++){

for(let j=i+1;j<particles.length;j++){

const dx=particles[i].x-particles[j].x
const dy=particles[i].y-particles[j].y

const dist=Math.sqrt(dx*dx+dy*dy)

if(dist<120){

ctx.beginPath()
ctx.moveTo(particles[i].x,particles[i].y)
ctx.lineTo(particles[j].x,particles[j].y)

ctx.strokeStyle=`rgba(199,125,255,${1-dist/120})`
ctx.lineWidth=.5
ctx.stroke()

}

}

}

requestAnimationFrame(animate)

}

animate()