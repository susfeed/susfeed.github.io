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

async function loadGames() {

    const response = await fetch("games.json");
    const data = await response.json();

    const featured = data.games.find(
        game => game.id === data.featured
    );

    document.getElementById("featured-game").innerHTML = `
        <div class="hero-content">
            <span class="tag">FEATURED GAME</span>

            <h1>${featured.title}</h1>

            <p>${featured.description}</p>

            <a href="${featured.folder}/index.html" class="play-btn">
                PLAY NOW
            </a>
        </div>

        <img src="${featured.cover}" alt="${featured.title}">
    `;

    const grid = document.getElementById("games-grid");

    data.games.forEach(game => {

        grid.innerHTML += `
            <a href="${game.folder}/index.html" class="game-card">

                <img src="${game.cover}" alt="${game.title}">

                <div class="game-info">

                    <h3>${game.title}</h3>

                    <p>${game.description}</p>

                    <span class="play-small">
                        PLAY
                    </span>

                </div>

            </a>
        `;

    });

}

loadGames();