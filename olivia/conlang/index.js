let words=[]
let learned=JSON.parse(localStorage.getItem("learned")||"[]")
let bookmarks=JSON.parse(localStorage.getItem("bookmarks")||"[]")

const video=document.getElementById("videoPlayer")
const title=document.getElementById("wordTitle")
const defs=document.getElementById("definitions")
const list=document.getElementById("wordList")
const bookmarkBtn=document.getElementById("bookmarkBtn")
const searchBox=document.getElementById("searchBox")
const clearSearch=document.getElementById("clearSearch")

let currentWord=null

function save(){
localStorage.setItem("learned",JSON.stringify(learned))
localStorage.setItem("bookmarks",JSON.stringify(bookmarks))
}

function shuffle(arr){
let a=[...arr]
for(let i=a.length-1;i>0;i--){
let j=Math.floor(Math.random()*(i+1))
let t=a[i]
a[i]=a[j]
a[j]=t
}
return a
}

function showWord(word){

currentWord=word

title.textContent=word.word
video.src="videos/"+word.word+".mp4"

defs.innerHTML=""

word.definitions.forEach(d=>{
let li=document.createElement("li")
li.textContent=d
defs.appendChild(li)
})

updateBookmarkButton()
}

function updateBookmarkButton(){

if(!currentWord) return

bookmarkBtn.textContent=
bookmarks.includes(currentWord.word)
? "Unbookmark"
: "Bookmark"

}

function buildList(filter="",random=false){

list.innerHTML=""

let source=random?shuffle(words):words

source
.filter(w =>
w.word.toLowerCase().includes(filter) ||
w.definitions.join(" ").toLowerCase().includes(filter)
)
.forEach(w=>{

let div=document.createElement("div")

div.className="wordItem"

if(learned.includes(w.word))
div.classList.add("learned")

if(bookmarks.includes(w.word))
div.classList.add("bookmarked")

div.textContent=w.word

div.onclick=()=>showWord(w)

list.appendChild(div)

})

}

function getUnlearnedWords(){
return words.filter(w=>!learned.includes(w.word))
}

function showRandomWord(){
if(words.length===0) return
let w=words[Math.floor(Math.random()*words.length)]
showWord(w)
}

function showNewWord(){

let unlearned=getUnlearnedWords()

if(unlearned.length===0){
showRandomWord()
return
}

let w=unlearned[Math.floor(Math.random()*unlearned.length)]

showWord(w)
}

searchBox.addEventListener("keydown",e=>{
if(e.key==="Enter"){
buildList(searchBox.value.toLowerCase())
}
})

clearSearch.onclick=()=>{
searchBox.value=""
buildList("",true)
}

document.getElementById("randomBtn").onclick=()=>{
showRandomWord()
}

document.getElementById("newBtn").onclick=()=>{
showNewWord()
}

bookmarkBtn.onclick=()=>{

if(!currentWord) return

if(bookmarks.includes(currentWord.word)){
bookmarks=bookmarks.filter(w=>w!==currentWord.word)
}else{
bookmarks.push(currentWord.word)
}

save()
updateBookmarkButton()
buildList()
}

document.getElementById("bookmarksBtn").onclick=()=>{

list.innerHTML=""

shuffle(words)
.filter(w=>bookmarks.includes(w.word))
.forEach(w=>{

let div=document.createElement("div")

div.className="wordItem bookmarked"

div.textContent=w.word

div.onclick=()=>showWord(w)

list.appendChild(div)

})
}

document.getElementById("homeHeader").onclick=()=>{
buildList("",true)
showNewWord()
}

video.addEventListener("ended",()=>{

if(!currentWord) return

if(!learned.includes(currentWord.word)){
learned.push(currentWord.word)
save()
buildList("",true)
}

})

fetch("index.json")
.then(r=>r.json())
.then(data=>{

words=data

buildList("",true)

showNewWord()

})