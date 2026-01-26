const STORY_DIST = 20000

const storyLevels = [
  {
    id: 0,
    name: "HELL",
    character: 0,
    theme: 0,
    color: "linear-gradient(180deg,#ff3b00,#5a0000)",
    icon: "neil.png",
    intro: [
        { text: "Neil wakes up in Hell." },
        { speaker: "Cam", icon: "cam.png", text: "Neil, how did you end up in Hell?" },
        { speaker: "Neil", icon: "neil.png", text: "I guess stealing Smeff has its consequences..." },
        { speaker: "Cam", icon: "cam.png", text: "Ah. Well, I'll try to reach you. Hold on until then." },
        { speaker: "Neil", icon: "neil.png", text: "Gotcha fam." }
    ],
    outro: [
      { speaker: "Neil", icon: "neil.png", text: "That was literally literally literally the worst." },
      { text: "Neil climbs up back to earth." }
    ]
  },
  {
    id: 1,
    name: "HEAVEN",
    character: 1,
    theme: 1,
    color: "linear-gradient(180deg,#ffffff,#d9cfff)",
    icon: "cam.png",
    intro: [
        { text: "Cameron gets off his throne." },
        { speaker: "Cam", icon: "cam.png", text: "Well, better go save Neil." }
    ],
    outro: [
        { speaker: "Cam", icon: "cam.png", text: "Perfection cracks eventually." },
        { text: "A crack in the sky opens, allowing Cameron to jump down to earth." }
    ]
  },
  {
    id: 2,
    name: "MESOPOTAMIA",
    character: 2,
    theme: 2,
    color: "linear-gradient(180deg,#7b6a4a,#2f281c)",
    icon: "smeff.png",
    intro: [
      { text: "6,000 years ago, during the first game of mancala." },
      { speaker: "Neil", icon: "neil.png", text: "Where am I? When am I>" },
      { speaker: "Smeff", icon: "smeff.png", text: "Ah, someone to play my new game." },
      { speaker: "Neil", icon: "neil.png", text: "Oh?" },
      { speaker: "Smeff", icon: "smeff.png", text: "You know, 6,000 years from now they'll still be playing it." },
      { speaker: "Smeff", icon: "smeff.png", text: "Let me show you." }
    ],
    outro: [
      { speaker: "Smeff", icon: "smeff.png", text: "See? It's pretty rad." },
      { speaker: "Neil", icon: "neil.png", text: "Uhhh... That still doesn't answer how I get back to my time." },
      { speaker: "Smeff", icon: "smeff.png", text: "I can use the beads to get you there." },
      { text: "Smeff throws mancala beads at Neil, knocking him out." },
      { text: "Neil awakens in a wooded area." }
    ]
  },
  {
    id: 3,
    name: "THE WOODS",
    character: 3,
    theme: 3,
    color: "linear-gradient(180deg,#6b4600,#004508)",
    icon: "chip.png",
    intro: [
      { speaker: "Chip", icon: "chip.png", text: "*Beaver noises*" },
      { text: "Something moves between the trees." }
    ],
    outro: [
      { speaker: "Neil", icon: "neil.png", text: "CHIP???" },
      { speaker: "Chip", icon: "chip.png", text: "*Beaver noises*" },
      { text: "Something falls from the sky." }
    ]
  },
  {
    id: 4,
    name: "UNIVERSAL",
    character: 4,
    theme: 4,
    color: "linear-gradient(180deg,#000000,#0026ff)",
    icon: "sara.png",
    intro: [
      { text: "Neil and Chip investigate." },
      { speaker: "Cam", icon: "cam.png", text: "Hey gang, glad to see you crawled out of Hell." },
      { speaker: "Neil", icon: "neil.png", text: "No thanks to you." },
      { speaker: "Chip", icon: "chip.png", text: "*Beaver noises*" },
      { speaker: "Cam", icon: "cam.png", text: "Chill, at least you got home." },
      { speaker: "Cam", icon: "cam.png", text: "Speaking of..." }
    ],
    outro: [
      { text: "Sara lands on earth." },
      { speaker: "Neil", icon: "neil.png", text: "You went to space?" },
      { speaker: "Sara", icon: "sara.png", text: "Yeah man." },
      { speaker: "Cam", icon: "cam.png", text: "She was looking for the rest of the Mou Ikkrew." },
      { speaker: "Cam", icon: "cam.png", text: "Have you found Phil?" },
      { speaker: "Sara", icon: "sara.png", text: "He's in the matrix." },
      { speaker: "Neil", icon: "neil.png", text: "???" }
    ]
  },
  {
    id: 5,
    name: "THE SERVER",
    character: 5,
    theme: 5,
    color: "linear-gradient(180deg,#1a1a1ae5,#000000)",
    icon: "phil.png",
    intro: [
      { text: "In the matrix." },
      { speaker: "Phil", icon: "phil.png", text: "Gotta reach the Mou Ikkrew." }
    ],
    outro: [
      { text: "Phil escapes the matrix." },
      { speaker: "Sara", icon: "sara.png", text: "MOU IKKREW IS BACK BOYS!" },
      { speaker: "Cam", icon: "cam.png", text: "LET'S FUCKING GO!!!" },
      { speaker: "Chip", icon: "chip.png", text: "*Beaver noises*" },
      { speaker: "Cam", icon: "cam.png", text: "Right. Phil did you find the thing?" },
      { speaker: "Phil", icon: "phil.png", text: "Yeah, I'll show you." }
    ]
  },
  {
    id: 6,
    name: "SUSFEED HQ",
    character: 6,
    theme: 6,
    color: "linear-gradient(180deg,#1a1a1ae5,#000000)",
    icon: "red.png",
    intro: [
      { text: "SusFeed HQ." },
      { speaker: "Phil", icon: "phil.png", text: "Here it is: the SusFeed source code." },
      { speaker: "Neil", icon: "neil.png", text: "For real?" },
      { speaker: "Phil", icon: "phil.png", text: "Yep. One of us just has to go in and extract it." },
      { speaker: "Chip", icon: "chip.png", text: "*Beaver noises*" },
      { speaker: "Sara", icon: "sara.png", text: "I agree, Cameron has the best chance of surviving this." },
      { speaker: "Cam", icon: "cam.png", text: "Uhhhhh..." },
      { speaker: "Phil", icon: "phil.png", text: "Great! Good luck!" }
    ],
    outro: [
      { text: "Cameron escapes with the code. Alarms go off." },
      { speaker: "Sara", icon: "sara.png", text: "Let's book it!" },
      { speaker: "Chip", icon: "chip.png", text: "*Beaver noises*" },
      { text: "The Boys escape." },
      { speaker: "Phil", icon: "phil.png", text: "Alright, let's look at the code." },
      { speaker: "Cam", icon: "cam.png", text: "Uhhhhh..." },
      { speaker: "Cam", icon: "cam.png", text: "It's encrypted?" },
      { text: "To be continued." }
    ]
  }
]

let storyProgress = Number(localStorage.getItem("storyProgress") || 0)
let currentStoryLevel = null
let typingInterval = null

const frame = document.querySelector(".frame")

const storyUI = document.createElement("div")
storyUI.style.cssText = `
position:absolute;
inset:0;
display:none;
align-items:center;
justify-content:center;
background:radial-gradient(circle,rgba(0,0,0,.6),rgba(0,0,0,.95));
z-index:30;
`

storyUI.innerHTML = `
<div style="
  width:640px;
  padding:36px;
  border-radius:24px;
  background:linear-gradient(180deg,#1a120a,#050302);
  border:1px solid rgba(255,200,140,.35);
  box-shadow:0 0 40px rgba(255,120,40,.35);
  text-align:center;
">
  <div id="storyHeader" style="
    letter-spacing:.4em;
    margin-bottom:18px;
    font-size:1.2rem;
    background:linear-gradient(90deg,#ffd27d,#ff6a00,#ffd27d);
    -webkit-background-clip:text;
    color:transparent;
  "></div>

  <div id="storyDialogue" style="
    display:flex;
    align-items:center;
    gap:18px;
    margin-bottom:26px;
    justify-content:center;
    min-height:120px;
  "></div>

  <button class="game-btn" id="storyNext">CONTINUE</button>
</div>
`

frame.appendChild(storyUI)

function openStory(){
  document.getElementById("titleScreen").style.display = "none"
  showLevelSelect()
}

function backToTitle(){
  storyUI.style.display = "none"
  document.getElementById("titleScreen").style.display = "flex"
}

function showLevelSelect(){
  paused = false
  gameMode = "menu"
  storyUI.style.display = "flex"
  document.getElementById("storyHeader").textContent = "STORY MODE"

  const buttons = storyLevels.map(l=>{
    const locked = l.id > storyProgress
    return `
      <button class="game-btn"
        style="width:240px;margin:8px auto;background:${l.color};color:#000;opacity:${locked?0.4:1};"
        ${locked?"disabled":""}
        onclick="startStoryLevel(${l.id})">
        ${l.name}
      </button>
    `
  }).join("")

  document.getElementById("storyDialogue").innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      ${buttons}
      <button class="game-btn" style="margin-top:18px;" onclick="backToTitle()">BACK TO TITLE</button>
    </div>
  `
  document.getElementById("storyNext").style.display = "none"
}

function startStoryLevel(id){
  currentStoryLevel = storyLevels[id]

  activeAudio.pause()
  inactiveAudio.pause()

  activeAudio.src = themes[currentStoryLevel.theme].song
  activeAudio.currentTime = 0
  activeAudio.volume = 1
  activeAudio.play().catch(console.warn)

  playDialogue(currentStoryLevel.intro, beginStoryRun)
}

function typeText(el, text){
  clearInterval(typingInterval)
  el.textContent = ""
  let i = 0
  typingInterval = setInterval(()=>{
    el.textContent += text[i++]
    if(i >= text.length) clearInterval(typingInterval)
  }, 22)
}

function playDialogue(lines, done){
  let i = 0
  storyUI.style.display = "flex"
  document.getElementById("storyNext").style.display = "inline-block"

  function advance(){
    clearInterval(typingInterval)
    if(i >= lines.length){
      document.getElementById("storyNext").onclick = null
      done()
      return
    }

    const d = lines[i++]
    document.getElementById("storyHeader").textContent = currentStoryLevel.name

    if(d.speaker){
      document.getElementById("storyDialogue").innerHTML = `
        <img src="${d.icon}" style="width:96px;height:96px;border-radius:12px;image-rendering:pixelated;box-shadow:0 0 18px rgba(255,200,120,.6);">
        <div style="text-align:left;">
          <div style="font-weight:bold;letter-spacing:.2em;margin-bottom:6px;">${d.speaker}</div>
          <div id="typedText" style="line-height:1.7;letter-spacing:.12em;"></div>
        </div>
      `
      typeText(document.getElementById("typedText"), d.text)
    }else{
      document.getElementById("storyDialogue").innerHTML = `
        <div id="typedText" style="line-height:1.8;letter-spacing:.14em;"></div>
      `
      typeText(document.getElementById("typedText"), d.text)
    }
  }

  document.getElementById("storyNext").onclick = advance
  advance()
}

function beginStoryRun(){
  storyUI.style.display = "none"
  gameMode = "story"
  lockedCharacter = currentStoryLevel.character
  lockedTheme = currentStoryLevel.theme
  initPlatforms()
  startZ = player.z
  requestAnimationFrame(loop)
}

const originalLoop = loop
loop = function(t){
  originalLoop(t)
  if(gameMode === "story"){
    const dist = Math.floor(startZ - player.z)
    if(dist >= STORY_DIST){
      finishStoryLevel()
    }
  }
}

function finishStoryLevel(){
  gameMode = "menu"
  paused = false
  activeAudio.pause()

  if(currentStoryLevel.id === storyProgress){
    storyProgress++
    localStorage.setItem("storyProgress", storyProgress)
  }

  playDialogue(currentStoryLevel.outro, ()=>{
    if(storyProgress >= storyLevels.length){
      showCredits()
    }else{
      showLevelSelect()
    }
  })
}

function showCredits(){
  storyUI.style.display = "flex"
  document.getElementById("storyHeader").textContent = "CREDITS"
  document.getElementById("storyDialogue").innerHTML = `
    <div style="line-height:2;letter-spacing:.25em;">
      THE BOYS<br><br>
      CREATED BY YOU<br><br>
      THANK YOU FOR PLAYING
    </div>
  `
  document.getElementById("storyNext").style.display = "inline-block"
  document.getElementById("storyNext").textContent = "BACK TO TITLE"
  document.getElementById("storyNext").onclick = backToTitle
}
