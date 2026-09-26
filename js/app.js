import {addSolve,getSolves,clearSolves,exportData,importData} from "./storage.js";
import {P2PRoom,link} from "./p2p.js";
const app=document.querySelector("#app"),toastEl=document.querySelector("#toast");let deferredInstall=null;let settings=JSON.parse(localStorage.getItem("cubeclash-settings")||"{}");settings.inspection??=15;settings.sound??=true;let s={puzzle:"333",scramble:"",phase:"ready",inspectionStart:0,solveStart:0,raf:0,last:null,room:null,role:null,opponent:{time:"0.00",status:"WAITING"},round:1};
const savedTheme=localStorage.getItem("cubeclash-theme");
function applyTheme(theme){document.body.classList.toggle("theme-light",theme==="light");document.documentElement.style.colorScheme=theme;localStorage.setItem("cubeclash-theme",theme);document.querySelectorAll(".theme-option").forEach(x=>x.classList.toggle("active",x.dataset.theme===theme));}
function bindTheme(){document.querySelectorAll(".theme-option").forEach(b=>b.onclick=()=>applyTheme(b.dataset.theme));}
function themePanel(){return `<div class="theme-panel"><div class="theme-head"><strong>SELECT THEME</strong><span>APPEARANCE</span></div><div class="theme-options"><button class="theme-option" data-theme="dark"><div class="theme-preview dark"></div><strong>DARK</strong><small>OBSIDIAN / HIGH CONTRAST</small></button><button class="theme-option" data-theme="light"><div class="theme-preview light"></div><strong>WHITE</strong><small>CLEAN / LIGHT GRID</small></button></div><div class="menu-note">YOUR THEME IS SAVED ON THIS DEVICE. YOU CAN CHANGE IT LATER IN SETTINGS.</div></div>`}
const toast=x=>{toastEl.textContent=x;toastEl.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove("show"),1800)};const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));const fmt=ms=>(ms/1000).toFixed(2);function v(x){app.innerHTML=`<section class="view">${x}</section>`}const MOVES={333:["R","L","U","D","F","B"],222:["R","L","U","D","F","B"]};
function randomScramble(){const faces=MOVES[s.puzzle]||MOVES[333],suffix=["","'","2"];let out=[],lastAxis="";const axis={R:"x",L:"x",U:"y",D:"y",F:"z",B:"z"};while(out.length<(s.puzzle==="222"?9:20)){const f=faces[Math.floor(Math.random()*faces.length)];if(axis[f]===lastAxis)continue;lastAxis=axis[f];out.push(f+suffix[Math.floor(Math.random()*suffix.length)]);}return out.join(" ");}
async function scr(){s.scramble=randomScramble();return s.scramble}function cube(){return `<div class="cube3d-wrap"><div class="cube3d" id="cube3d" data-puzzle="${s.puzzle}" data-scramble="${esc(s.scramble)}"></div></div>`}
function rot(v,axis,dir){let [x,y,z]=v;if(axis==="x")return dir>0?[x,-z,y]:[x,z,-y];if(axis==="y")return dir>0?[z,y,-x]:[-z,y,x];return dir>0?[-y,x,z]:[y,-x,z]}
function buildCubeState(size,scramble){const vals=[-1,1],coords=[];for(let x=0;x<size;x++)for(let y=0;y<size;y++)for(let z=0;z<size;z++)coords.push({p:[x*2/(size-1)-1,y*2/(size-1)-1,z*2/(size-1)-1],stickers:[]});const colors={x1:"R",x0:"O",y1:"W",y0:"Y",z1:"G",z0:"B"};for(const c of coords){const [x,y,z]=c.p;if(x===1)c.stickers.push([[1,0,0],colors.x1]);if(x===-1)c.stickers.push([[-1,0,0],colors.x0]);if(y===1)c.stickers.push([[0,1,0],colors.y1]);if(y===-1)c.stickers.push([[0,-1,0],colors.y0]);if(z===1)c.stickers.push([[0,0,1],colors.z1]);if(z===-1)c.stickers.push([[0,0,-1],colors.z0]);}
for(const token of scramble.trim().split(/\s+/)){if(!token)continue;const face=token[0],turns=token.endsWith("2")?2:1,dir=token.includes("'")?-1:1;const axis={R:"x",L:"x",U:"y",D:"y",F:"z",B:"z"}[face];const layer={R:1,L:-1,U:1,D:-1,F:1,B:-1}[face];const sign={R:-1,L:1,U:1,D:-1,F:-1,B:1}[face];for(let n=0;n<turns;n++)for(const c of coords){if(c.p[axis==="x"?0:axis==="y"?1:2]!==layer)continue;c.p=rot(c.p,axis,sign*dir);c.stickers=c.stickers.map(([normal,color])=>[rot(normal,axis,sign*dir),color]);}}
return coords}
function stickerTransform(n){const [x,y,z]=n;if(x===1)return "translateZ(0px) rotateY(90deg) translateZ(31px)";if(x===-1)return "rotateY(-90deg) translateZ(31px)";if(y===1)return "rotateX(90deg) translateZ(31px)";if(y===-1)return "rotateX(-90deg) translateZ(31px)";if(z===1)return "translateZ(31px)";return "rotateY(180deg) translateZ(31px)"}
function renderCube(){const root=document.querySelector("#cube3d");if(!root)return;const size=s.puzzle==="222"?2:3;const spacing=size===2?76:58;const state=buildCubeState(size,s.scramble);root.innerHTML="";for(const c of state){const el=document.createElement("div");el.className="cubelet";el.style.width=`${spacing-4}px`;el.style.height=`${spacing-4}px`;el.style.transform=`translate3d(${c.p[0]*spacing/2}px,${-c.p[1]*spacing/2}px,${c.p[2]*spacing/2}px)`;for(const [n,color] of c.stickers){const st=document.createElement("i");st.className=`sticker sticker-${color}`;st.style.transform=stickerTransform(n);el.appendChild(st)}root.appendChild(el)}}
async function mountCube(){try{renderCube()}catch(err){console.error("CubeClash cube renderer error:",err);const h=document.querySelector("#cube3d");if(h)h.innerHTML=`<div class="cube-error"><strong>3D CUBE ERROR</strong><span>${esc(err.message||String(err))}</span></div>`}}
async function solo(){if(!s.scramble)await scr();const a=await getSolves(),valid=a.filter(x=>x.penalty!=="DNF").map(x=>x.timeMs+(x.penalty==="+2"?2000:0));const avg=n=>valid.length>=n?fmt(valid.slice(0,n).reduce((a,b)=>a+b,0)/n):"—";v(`<div class="timer-page"><div class="timer-top"><div class="section-title" style="flex:1;margin:0"><h1>SOLO TIMER</h1><small>LOCAL SESSION</small></div><div class="room-actions"><select id="p"><option value="333" ${s.puzzle==="333"?"selected":""}>3×3</option><option value="222" ${s.puzzle==="222"?"selected":""}>2×2</option></select><button class="ghost-btn" id="new">NEW SCRAMBLE</button><button class="ghost-btn" data-view="home">BACK</button></div></div><div class="scramble-bar"><div class="scramble-text">${esc(s.scramble)}</div><button class="ghost-btn" id="copy">COPY</button></div><div class="timer-layout"><div class="timer-panel"><div class="timer-zone" id="zone"><div class="timer-status"><div class="timer-value" id="tv">${s.last?.display||"0.00"}</div><div class="timer-label" id="tl">READY</div><div class="timer-hint">SPACE / ENTER · TOUCH TO START</div></div></div><div class="timer-panel-footer"><div class="metric"><small>PUZZLE</small><strong>${s.puzzle==="333"?"3×3":"2×2"}</strong></div><div class="metric"><small>INSPECTION</small><strong>${settings.inspection}s</strong></div><div class="metric"><small>LAST</small><strong>${s.last?.display||"—"}</strong></div></div></div><div class="cube-panel"><div class="cube-head"><span>SCRAMBLE VISUALIZATION</span><span>3D</span></div>${cube()}</div></div><div class="stats-panel"><div class="stats-grid"><div class="stat-box"><small>SOLVES</small><strong>${a.length}</strong></div><div class="stat-box"><small>BEST</small><strong>${valid.length?fmt(Math.min(...valid)):"—"}</strong></div><div class="stat-box"><small>AO5</small><strong>${avg(5)}</strong></div><div class="stat-box"><small>AO12</small><strong>${avg(12)}</strong></div></div><div class="solves-list">${a.slice(0,12).map((x,i)=>`<div class="solve-row"><span>${a.length-i}</span><span>${esc(x.scramble)}</span><span>${esc(x.display)}</span><span class="muted">${x.puzzle==="333"?"3×3":"2×2"}</span></div>`).join("")||'<div class="empty">NO SOLVES YET</div>'}</div></div></div>`);bindSolo()}
function set(ms,label){document.querySelector("#tv").textContent=fmt(ms);document.querySelector("#tl").textContent=label}function stop(){cancelAnimationFrame(s.raf)}function loop(){const n=performance.now();if(s.phase==="inspection")set(Math.max(0,settings.inspection*1000-(n-s.inspectionStart)),"INSPECTION");if(s.phase==="solving")set(n-s.solveStart,"SOLVING");s.raf=requestAnimationFrame(loop)}function press(){if(s.phase==="ready"||s.phase==="stopped"){s.phase="inspection";s.inspectionStart=performance.now();loop();return}if(s.phase==="inspection"){const e=performance.now()-s.inspectionStart;s.penalty=e>=17000?"DNF":e>=15000?"+2":"";s.phase="solving";s.solveStart=performance.now();return}if(s.phase==="solving")finish()}async function finish(){const ms=performance.now()-s.solveStart;stop();s.phase="stopped";const display=s.penalty==="DNF"?"DNF":fmt(ms+(s.penalty==="+2"?2000:0));s.last={display};await addSolve({id:crypto.randomUUID(),createdAt:Date.now(),puzzle:s.puzzle,scramble:s.scramble,timeMs:ms,penalty:s.penalty,display});toast(display);setTimeout(async()=>{s.phase="ready";await scr();solo()},300)}function bindSolo(){mountCube();document.querySelector("#new").onclick=async()=>{stop();s.phase="ready";await scr();solo()};document.querySelector("#p").onchange=async e=>{s.puzzle=e.target.value;stop();s.phase="ready";await scr();solo()};document.querySelector("#copy").onclick=()=>navigator.clipboard?.writeText(s.scramble).then(()=>toast("SCRAMBLE COPIED"));document.querySelector("#zone").onpointerdown=()=>press();window.onkeydown=e=>{if((e.code==="Space"||e.code==="Enter")&&!e.repeat){e.preventDefault();press()}}}
function tutorial(){v(`<div class="tutorial-screen"><div class="tutorial-card"><div class="tutorial-kicker">FIRST TIME SETUP / 01</div><h1 class="tutorial-title">HOW CUBECLASH WORKS</h1><p class="tutorial-intro">A quick guide before you start. You can reopen this tutorial later from the menu.</p><div class="tutorial-steps"><article><span>01</span><h2>CHOOSE A PUZZLE</h2><p>Select 2×2 or 3×3. CubeClash generates a new random-state scramble for every solve.</p></article><article><span>02</span><h2>READ THE SCRAMBLE</h2><p>The 3D cube shows the exact state produced by the scramble, so the visual matches the moves shown above it.</p></article><article><span>03</span><h2>INSPECTION</h2><p>Press Space, Enter, or touch the timer to begin inspection. Under 15 seconds is normal, 15 to under 17 seconds is +2, and 17 seconds or more is DNF.</p></article><article><span>04</span><h2>SOLVE</h2><p>Press again to start the solve, then press again when you finish. Your result is saved on this device.</p></article><article><span>05</span><h2>1V1 ROOMS</h2><p>For beta, rooms use a browser-to-browser WebRTC connection. The host and guest exchange connection data to connect.</p></article><article><span>06</span><h2>YOUR DATA</h2><p>Solves and settings stay in your browser. Use JSON export if you want a backup or to move your timer data.</p></article></div><div class="tutorial-actions"><button class="primary-btn" id="tutorialStart">I UNDERSTAND — OPEN MENU</button></div></div></div>`);document.querySelector("#tutorialStart").onclick=()=>{localStorage.setItem("cubeclash-tutorial-seen","1");home()}}
function dashboard(){v(`<div class="hero"><div class="hero-grid"><div><div class="section-title"><small>01 / SPEEDCUBING PLATFORM</small><small>BETA</small></div><h1 class="hero-title cube-font">CUBE<span>CLASH</span></h1><p class="hero-copy">A smooth responsive 2×2 and 3×3 speedcubing timer with random-state scrambles, real 3D scramble visualization, local history, installable PWA support, and peer-to-peer 1v1 rooms.</p><div class="hero-actions"><button class="primary-btn" data-view="solo">SOLO TIMER</button><button class="ghost-btn" data-view="room">CREATE / JOIN 1V1</button></div></div><div class="technical-card"><div class="spec-list"><div class="spec"><span>PUZZLES</span><span>2×2 / 3×3</span></div><div class="spec"><span>SCRAMBLES</span><span>RANDOM-STATE</span></div><div class="spec"><span>SYNC</span><span>WEBRTC P2P</span></div><div class="spec"><span>STORAGE</span><span>INDEXEDDB</span></div><div class="spec"><span>INSTALL</span><span>PWA</span></div></div></div></div></div>`)}
function home(){v(`<div class="menu-screen"><div class="menu-wrap"><section class="menu-main"><div class="menu-content"><div class="menu-kicker">WELCOME / CUBECLASH BETA</div><h1 class="menu-title">CUBE<span>CLASH</span></h1><p class="menu-sub">A competitive speedcubing platform for 2×2 and 3×3. Choose your appearance, then enter the timer or a 1v1 room.</p><div class="menu-actions"><button class="menu-action" data-view="solo"><span>SOLO TIMER</span><span class="arrow">→</span></button><button class="menu-action" data-view="room"><span>CREATE / JOIN 1V1</span><span class="arrow">→</span></button><button class="menu-action" data-view="settings"><span>SETTINGS</span><span class="arrow">→</span></button></div></div></section>${themePanel()}</div></div>`);bindTheme();applyTheme(savedTheme||"dark")}

function room(){v(`<div class="room-page"><div class="section-title"><h1>1V1 ROOM</h1><small>DEVICE ↔ DEVICE / WEBRTC</small></div><div class="room-layout"><div class="room-card"><h2>CREATE ROOM</h2><div class="form-grid"><div class="field"><label>PUZZLE</label><select id="rp"><option value="333">3×3</option><option value="222">2×2</option></select></div><div class="field"><label>ROUNDS</label><select id="rr"><option>3</option><option selected>5</option><option>7</option></select></div><div class="field"><label>INSPECTION</label><select id="ri"><option>15</option><option>10</option><option>0</option></select></div><div class="field"><label>FORMAT</label><select id="rf"><option>FIRST TO</option><option>BEST OF</option></select></div></div><div class="checks"><label class="check"><input id="rp2" type="checkbox" checked> +2</label><label class="check"><input id="rdnf" type="checkbox" checked> DNF</label></div><button class="primary-btn" id="create">CREATE ROOM</button></div><div class="room-card"><h2>JOIN / CONNECT</h2><p style="color:#666;font-size:12px;line-height:1.6">For this beta, the two browsers exchange one offer and one answer. After that, the actual match traffic is peer-to-peer.</p><div class="field"><label>OFFER / ANSWER LINK</label><textarea class="code-box" id="conn" placeholder="Paste the connection link or encoded data here"></textarea></div><div class="room-actions"><button class="primary-btn" id="join">JOIN OFFER</button><button class="ghost-btn" id="answer">APPLY ANSWER</button></div></div></div><div id="rs" class="empty">NO ACTIVE ROOM</div></div>`);document.querySelector("#create").onclick=createRoom;document.querySelector("#join").onclick=join;document.querySelector("#answer").onclick=apply}
function showRoom(t,l=""){const e=document.querySelector("#rs");e.className="room-card";e.innerHTML=`<h2>${esc(t)}</h2>${l?`<textarea readonly class="code-box room-link" id="roomLink">${esc(l)}</textarea><div class="room-actions"><button class="primary-btn" id="copyLink">COPY LINK</button></div>`:""}`;document.querySelector("#copyLink")?.addEventListener("click",async()=>{const ok=await navigator.clipboard?.writeText(l).then(()=>true).catch(()=>false);if(!ok){const a=document.querySelector("#roomLink");a.focus();a.select();document.execCommand("copy")}toast("LINK COPIED")})}
async function createRoom(){
  try{
    s.role="host";
    s.puzzle=document.querySelector("#rp").value;
    s.match={rounds:+document.querySelector("#rr").value,inspection:+document.querySelector("#ri").value,format:document.querySelector("#rf").value,allowPlus2:document.querySelector("#rp2").checked,allowDNF:document.querySelector("#rdnf").checked,round:1,score:[0,0],status:"WAITING",scramble:""};
    s.room=new P2PRoom();
    wireRoom();
    showRoom("CREATING ROOM","Generating WebRTC offer… please wait a few seconds.");
    const offer=await s.room.createOffer();
    const share=link("offer",offer);
    showRoom("ROOM CREATED",share);
    toast("ROOM LINK GENERATED");
  }catch(err){
    console.error("CubeClash create room error:",err);
    showRoom("ROOM CREATION FAILED",String(err?.message||err));
    toast("CREATE ROOM FAILED");
  }
}
function payload(raw){
  const value=raw.trim();
  try{
    if(value.startsWith("http://")||value.startsWith("https://")){
      const u=new URL(value);
      const eq=u.hash.indexOf("=");
      return eq>=0?decodeURIComponent(u.hash.slice(eq+1)):value;
    }
  }catch{}
  return value.includes("=")?decodeURIComponent(value.slice(value.indexOf("=")+1)):value;
}
async function join(){
  try{
    const value=payload(document.querySelector("#conn").value);
    if(!value)throw new Error("Paste a Player 1 offer link first.");
    s.role="guest";
    s.room=new P2PRoom();
    wireRoom();
    showRoom("CONNECTING","Reading Player 1 offer…");
    const answer=await s.room.acceptOffer(value);
    const share=link("answer",answer);
    showRoom("ANSWER READY — SEND THIS BACK TO PLAYER 1",share);
    toast("ANSWER LINK GENERATED");
  }catch(err){
    console.error("CubeClash join error:",err);
    showRoom("JOIN FAILED",String(err?.message||err));
    toast("JOIN FAILED");
  }
}
async function apply(){
  try{
    const value=payload(document.querySelector("#conn").value);
    if(!s.room)throw new Error("This browser does not have the Player 1 room open. Create the room again here, then apply Player 2's answer.");
    await s.room.acceptAnswer(value);
    showRoom("CONNECTING","Waiting for Player 2…");
    toast("ANSWER APPLIED");
  }catch(err){
    console.error("CubeClash answer error:",err);
    toast("ANSWER FAILED");
  }
}
function wireRoom(){
  s.room.on("state",state=>{
    const e=document.querySelector("#rs");
    if(e&&state) e.innerHTML=`<h2>CONNECTION: ${esc(String(state).toUpperCase())}</h2><p style="color:#777;font:500 11px var(--mono)">Keep this tab open while playing.</p>`;
    if(state==="connected"&&s.role==="host"){
      (async()=>{
        if(!s.scramble)s.scramble=await scr();
        const config={type:"match-config",match:{...s.match,puzzle:s.puzzle},scramble:s.scramble};
        s.room.send(config);
        toast("PLAYER 2 CONNECTED");
      })().catch(err=>console.error("match sync error",err));
    }
  }).on("message",msg=>{
    if(msg.type==="match-config"&&s.role==="guest"){
      s.match=msg.match;s.puzzle=msg.match.puzzle;s.scramble=msg.scramble||"";
      toast("MATCH READY");
    }
  }).on("error",err=>console.error("CubeClash WebRTC error:",err));
}
function settingsView(){v(`<div class="section-title"><h1>SETTINGS</h1><small>LOCAL DEVICE</small></div><div class="settings-grid"><div class="setting-card"><h2>APPEARANCE</h2><div class="theme-options" style="margin-top:14px"><button class="theme-option" data-theme="dark"><div class="theme-preview dark"></div><strong>DARK</strong><small>OBSIDIAN / HIGH CONTRAST</small></button><button class="theme-option" data-theme="light"><div class="theme-preview light"></div><strong>WHITE</strong><small>CLEAN / LIGHT GRID</small></button></div></div><div class="setting-card"><h2>TIMER</h2><div class="field"><label>INSPECTION SECONDS</label><select id="ins"><option ${settings.inspection===0?"selected":""}>0</option><option ${settings.inspection===10?"selected":""}>10</option><option ${settings.inspection===15?"selected":""}>15</option></select></div><div class="room-actions"><button class="primary-btn" id="save">SAVE SETTINGS</button></div></div><div class="setting-card"><h2>DATA</h2><p style="color:#666;font-size:12px;line-height:1.6">Solves are stored locally in IndexedDB. Export before clearing browser data or changing devices.</p><div class="room-actions"><button class="ghost-btn" id="ex">EXPORT JSON</button><label class="ghost-btn" style="display:grid;place-items:center;cursor:pointer">IMPORT JSON<input id="im" type="file" accept=".json" hidden></label><button class="danger-btn" id="cl">CLEAR SOLVES</button></div></div></div>`);bindTheme();applyTheme(localStorage.getItem("cubeclash-theme")||"dark");document.querySelector("#save").onclick=()=>{settings.inspection=+document.querySelector("#ins").value;localStorage.setItem("cubeclash-settings",JSON.stringify(settings));toast("SETTINGS SAVED")};document.querySelector("#ex").onclick=async()=>{const b=new Blob([JSON.stringify(await exportData(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`cubeclash-${Date.now()}.json`;a.click()};document.querySelector("#im").onchange=async e=>{try{await importData(JSON.parse(await e.target.files[0].text()));toast("DATA IMPORTED")}catch{toast("IMPORT FAILED")}};document.querySelector("#cl").onclick=async()=>{if(confirm("Clear all local solves?")){await clearSolves();toast("SOLVES CLEARED")}}}
async function nav(x){if(x==="home")home();if(x==="solo")await solo();if(x==="room")room();if(x==="settings")settingsView()}document.addEventListener("click",e=>{const x=e.target.closest("[data-view]");if(x)nav(x.dataset.view)});window.addEventListener("online",()=>{document.querySelector("#networkText").textContent="ONLINE"});window.addEventListener("offline",()=>{document.querySelector("#networkText").textContent="OFFLINE"});window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;document.querySelector("#installBtn").hidden=false});document.querySelector("#installBtn").onclick=async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null}};if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./service-worker.js");if(localStorage.getItem("cubeclash-tutorial-seen")==="1")home();else tutorial();
if(location.hash){
  const hash=location.hash;
  if(hash.startsWith("#offer=")||hash.startsWith("#answer=")){
    setTimeout(()=>{
      const kind=hash.startsWith("#offer=")?"OFFER":"ANSWER";
      home();room();
      document.querySelector("#conn").value=location.href;
      toast(`${kind} LINK LOADED`);
    },100);
  }
}
