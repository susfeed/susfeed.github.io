const settingsState=JSON.parse(localStorage.getItem("settings")||"{}")

settingsState.volume??=1
settingsState.muted??=false
settingsState.grayscale??=false
settingsState.invert??=false
settingsState.highContrast??=false
settingsState.colorblind??="none"
settingsState.song??=0
settingsState.showFPS??=false
settingsState.showSpeed??=false
settingsState.retroMode ??= false

function saveSettings(){
  localStorage.setItem("settings",JSON.stringify(settingsState))
}

function applyVisualFilters(){
  let f=""
  if(settingsState.grayscale)f+="grayscale(1) "
  if(settingsState.invert)f+="invert(1)"
  document.body.style.filter=f
  document.body.classList.toggle("high-contrast",settingsState.highContrast)
  document.body.setAttribute("data-colorblind",settingsState.colorblind)
}

applyVisualFilters()
activeAudio.volume=settingsState.muted?0:settingsState.volume

const root=document.createElement("div")
root.innerHTML=`
<link rel="stylesheet" href="theboys.css">

<div class="overlay-menu" id="settingsMenu">
  <div class="panel">
    <h2>SETTINGS</h2>

    <div class="setting"><span>SONG</span><select id="songSelect"></select></div>
    <div class="setting"><span>VOLUME</span><input type="range" min="0" max="1" step="0.01" id="vol"></div>
    <div class="setting toggle"><span>MUTE MUSIC</span><input type="checkbox" id="mute"></div>

    <hr>

    <div class="setting toggle"><span>BLACK & WHITE</span><input type="checkbox" id="gray"></div>
    <div class="setting toggle"><span>INVERT COLORS</span><input type="checkbox" id="inv"></div>
    <div class="setting toggle"><span>HIGH CONTRAST</span><input type="checkbox" id="contrast"></div>

    <hr>

    <div class="setting toggle">
      <span>RETRO MODE</span>
      <input type="checkbox" id="retroToggle">
    </div>

    <hr>

    <div class="setting">
      <span>COLORBLIND</span>
      <select id="colorblind">
        <option value="none">None</option>
        <option value="deuter">Deuteranopia</option>
        <option value="protan">Protanopia</option>
        <option value="tritan">Tritanopia</option>
      </select>
    </div>

    <hr>

    <div class="setting toggle"><span>SHOW FPS</span><input type="checkbox" id="fpsToggle"></div>
    <div class="setting toggle"><span>SHOW SPEED</span><input type="checkbox" id="speedToggle"></div>

    <button class="game-btn" onclick="closeMenus()">CLOSE</button>
  </div>
</div>
`
document.body.appendChild(root)

function injectMenuButtons(){
  const menus=document.querySelectorAll("#titleScreen,#pauseMenu")
  menus.forEach(menu=>{
    if(!menu||menu.querySelector(".menu-extra"))return
    const btn=menu.querySelector(".game-btn")
    if(!btn)return
    const wrap=document.createElement("div")
    wrap.className="menu-extra"
    wrap.innerHTML=`<button class="menu-mini">⚙ Settings</button>`
    btn.parentElement.appendChild(wrap)
    wrap.firstChild.onclick=()=>settingsMenu.style.display="flex"
  })
}
setInterval(injectMenuButtons,300)

function closeMenus(){
  settingsMenu.style.display="none"
}

themes.forEach((t,i)=>{
  const o=document.createElement("option")
  o.value=i
  o.textContent=t.name
  songSelect.appendChild(o)
})

songSelect.value=settingsState.song
songSelect.onchange=e=>{
  settingsState.song=+e.target.value
  activeAudio.src=themes[settingsState.song].song
  activeAudio.play()
  saveSettings()
}

vol.value=settingsState.volume
vol.oninput=e=>{
  settingsState.volume=+e.target.value
  activeAudio.volume=settingsState.muted?0:settingsState.volume
  saveSettings()
}

mute.checked=settingsState.muted
mute.onchange=e=>{
  settingsState.muted=e.target.checked
  activeAudio.volume=settingsState.muted?0:settingsState.volume
  saveSettings()
}

gray.checked=settingsState.grayscale
gray.onchange=e=>{
  settingsState.grayscale=e.target.checked
  applyVisualFilters()
  saveSettings()
}

inv.checked=settingsState.invert
inv.onchange=e=>{
  settingsState.invert=e.target.checked
  applyVisualFilters()
  saveSettings()
}

contrast.checked=settingsState.highContrast
contrast.onchange=e=>{
  settingsState.highContrast=e.target.checked
  applyVisualFilters()
  saveSettings()
}

colorblind.value=settingsState.colorblind
colorblind.onchange=e=>{
  settingsState.colorblind=e.target.value
  applyVisualFilters()
  saveSettings()
}

retroToggle.checked = settingsState.retroMode

retroToggle.onchange = e => {
  settingsState.retroMode = e.target.checked
  saveSettings()
  location.reload()
}

fpsToggle.checked=settingsState.showFPS
fpsToggle.onchange=e=>{
  settingsState.showFPS=e.target.checked
  saveSettings()
}

speedToggle.checked=settingsState.showSpeed
speedToggle.onchange=e=>{
  settingsState.showSpeed=e.target.checked
  saveSettings()
}

addEventListener("keydown",e=>{
  if(e.code==="Escape"&&settingsMenu.style.display==="flex"){
    closeMenus()
    e.preventDefault()
  }
})

const gameHud=document.getElementById("hud")||document.body
const fpsEl=document.createElement("div")
const speedEl=document.createElement("div")

fpsEl.id="fps"
speedEl.id="speed"

gameHud.appendChild(fpsEl)
gameHud.appendChild(speedEl)

let last=performance.now(),frames=0
function hudLoop(t){
  frames++
  if(t-last>1000){
    fpsEl.textContent=settingsState.showFPS?`FPS ${frames}`:""
    frames=0
    last=t
  }

  if(settingsState.showSpeed){
    const s=Math.abs(player.vz)
    speedEl.textContent=`SPD ${s.toFixed(1)}`
    speedEl.style.color=
      s<0.6?"#ffd27d":
      s<1.2?"#ffb347":
      s<2?"#ff7a18":
      "#ff2a00"
  }else{
    speedEl.textContent=""
  }

  requestAnimationFrame(hudLoop)
}
hudLoop()
