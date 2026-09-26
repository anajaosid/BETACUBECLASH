import {addSolve,getSolves,clearSolves,exportData,importData} from "./storage.js";
import {wipeCubeClashData} from "./reset.js";
import {P2PRoom} from "./p2p.js";
const app=document.querySelector("#app"),toastEl=document.querySelector("#toast");let deferredInstall=null;let settings=JSON.parse(localStorage.getItem("cubeclash-settings")||"{}");settings.inspection??=15;settings.sound??=true;let s={puzzle:"333",scramble:"",phase:"ready",inspectionStart:0,solveStart:0,raf:0,last:null,room:null,role:null,opponent:{time:"0.00",status:"WAITING"},round:1};
const savedTheme=localStorage.getItem("cubeclash-theme");
s.matchWindow=null;
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
function stickerTransform(n){const [x,y,z]=n;const d=31;if(x===1)return `rotateY(90deg) translateZ(${d}px)`;if(x===-1)return `rotateY(-90deg) translateZ(${d}px)`;if(y===1)return `rotateX(90deg) translateZ(${d}px)`;if(y===-1)return `rotateX(-90deg) translateZ(${d}px)`;if(z===1)return `translateZ(${d}px)`;return `rotateY(180deg) translateZ(${d}px)`}
function renderCube(){const root=document.querySelector("#cube3d");if(!root)return;const size=s.puzzle==="222"?2:3;const gap=size===2?7:5;const cubie=size===2?76:58;const pitch=cubie+gap;const step=size===2?pitch/2:pitch;const state=buildCubeState(size,s.scramble);root.innerHTML="";root.style.width=`${size*pitch}px`;root.style.height=`${size*pitch}px`;root.dataset.size=size;for(const c of state){const el=document.createElement("div");el.className="cubelet";el.style.width=`${cubie}px`;el.style.height=`${cubie}px`;el.style.setProperty("--half",`${cubie/2}px`);el.style.transform=`translate3d(${c.p[0]*step}px,${-c.p[1]*step}px,${c.p[2]*step}px)`;for(const [n,color] of c.stickers){const st=document.createElement("i");st.className=`sticker sticker-${color}`;st.style.transform=stickerTransform(n);el.appendChild(st)}root.appendChild(el)}
  root.onpointerdown=e=>{root.setPointerCapture(e.pointerId);root.dataset.dragging="1";root._sx=e.clientX;root._sy=e.clientY;root._rx=parseFloat(root.dataset.rx||"-28");root._ry=parseFloat(root.dataset.ry||"-38")};root.onpointermove=e=>{if(root.dataset.dragging!=="1")return;const dx=e.clientX-root._sx,dy=e.clientY-root._sy;root.style.transform=`rotateX(${root._rx-dy*.35}deg) rotateY(${root._ry+dx*.35}deg)`};root.onpointerup=root.onpointercancel=e=>{root.dataset.dragging="0";const m=getComputedStyle(root).transform;if(m&&m!=="none"){} };}
async function mountCube(){try{renderCube()}catch(err){console.error("CubeClash cube renderer error:",err);const h=document.querySelector("#cube3d");if(h)h.innerHTML=`<div class="cube-error"><strong>3D CUBE ERROR</strong><span>${esc(err.message||String(err))}</span></div>`}}
async function solo(){if(!s.scramble)await scr();const a=await getSolves(),valid=a.filter(x=>x.penalty!=="DNF").map(x=>x.timeMs+(x.penalty==="+2"?2000:0));const avg=n=>valid.length>=n?fmt(valid.slice(0,n).reduce((a,b)=>a+b,0)/n):"—";v(`<div class="timer-page"><div class="timer-top"><div class="section-title" style="flex:1;margin:0"><h1>SOLO TIMER</h1><small>LOCAL SESSION</small></div><div class="room-actions"><select id="p"><option value="333" ${s.puzzle==="333"?"selected":""}>3×3</option><option value="222" ${s.puzzle==="222"?"selected":""}>2×2</option></select><button class="ghost-btn" id="new">NEW SCRAMBLE</button><button class="ghost-btn" data-view="home">BACK</button></div></div><div class="scramble-bar"><div class="scramble-text">${esc(s.scramble)}</div><button class="ghost-btn" id="copy">COPY</button></div><div class="timer-layout"><div class="timer-panel"><div class="timer-zone" id="zone"><div class="timer-status"><div class="timer-value" id="tv">${s.last?.display||"0.00"}</div><div class="timer-label" id="tl">READY</div><div class="timer-hint">SPACE / ENTER · TOUCH TO START</div></div></div><div class="timer-panel-footer"><div class="metric"><small>PUZZLE</small><strong>${s.puzzle==="333"?"3×3":"2×2"}</strong></div><div class="metric"><small>INSPECTION</small><strong>${settings.inspection}s</strong></div><div class="metric"><small>LAST</small><strong>${s.last?.display||"—"}</strong></div></div></div><div class="cube-panel"><div class="cube-head"><span>SCRAMBLE VISUALIZATION</span><span>3D</span></div>${cube()}</div></div><div class="stats-panel"><div class="stats-grid"><div class="stat-box"><small>SOLVES</small><strong>${a.length}</strong></div><div class="stat-box"><small>BEST</small><strong>${valid.length?fmt(Math.min(...valid)):"—"}</strong></div><div class="stat-box"><small>AO5</small><strong>${avg(5)}</strong></div><div class="stat-box"><small>AO12</small><strong>${avg(12)}</strong></div></div><div class="solves-list">${a.slice(0,12).map((x,i)=>`<div class="solve-row"><span>${a.length-i}</span><span>${esc(x.scramble)}</span><span>${esc(x.display)}</span><span class="muted">${x.puzzle==="333"?"3×3":"2×2"}</span></div>`).join("")||'<div class="empty">NO SOLVES YET</div>'}</div></div></div>`);bindSolo()}
function set(ms,label){document.querySelector("#tv").textContent=fmt(ms);document.querySelector("#tl").textContent=label}function stop(){cancelAnimationFrame(s.raf)}function loop(){const n=performance.now();if(s.phase==="inspection")set(Math.max(0,settings.inspection*1000-(n-s.inspectionStart)),"INSPECTION");if(s.phase==="solving")set(n-s.solveStart,"SOLVING");s.raf=requestAnimationFrame(loop)}function press(){if(s.phase==="ready"||s.phase==="stopped"){s.phase="inspection";s.inspectionStart=performance.now();loop();return}if(s.phase==="inspection"){const e=performance.now()-s.inspectionStart;s.penalty=e>=17000?"DNF":e>=15000?"+2":"";s.phase="solving";s.solveStart=performance.now();return}if(s.phase==="solving")finish()}async function finish(){const ms=performance.now()-s.solveStart;stop();s.phase="stopped";const display=s.penalty==="DNF"?"DNF":fmt(ms+(s.penalty==="+2"?2000:0));s.last={display};await addSolve({id:crypto.randomUUID(),createdAt:Date.now(),puzzle:s.puzzle,scramble:s.scramble,timeMs:ms,penalty:s.penalty,display});toast(display);setTimeout(async()=>{s.phase="ready";await scr();solo()},300)}function bindSolo(){mountCube();document.querySelector("#new").onclick=async()=>{stop();s.phase="ready";await scr();solo()};document.querySelector("#p").onchange=async e=>{s.puzzle=e.target.value;stop();s.phase="ready";await scr();solo()};document.querySelector("#copy").onclick=()=>navigator.clipboard?.writeText(s.scramble).then(()=>toast("SCRAMBLE COPIED"));document.querySelector("#zone").onpointerdown=()=>press();window.onkeydown=e=>{if((e.code==="Space"||e.code==="Enter")&&!e.repeat){e.preventDefault();press()}}}
function tutorial(){v(`<div class="tutorial-screen"><div class="tutorial-card"><div class="tutorial-kicker">FIRST TIME SETUP / 01</div><h1 class="tutorial-title">HOW CUBECLASH WORKS</h1><p class="tutorial-intro">A quick guide before you start. You can reopen this tutorial later from the menu.</p><div class="tutorial-steps"><article><span>01</span><h2>CHOOSE A PUZZLE</h2><p>Select 2×2 or 3×3. CubeClash generates a new random-state scramble for every solve.</p></article><article><span>02</span><h2>READ THE SCRAMBLE</h2><p>The 3D cube shows the exact state produced by the scramble, so the visual matches the moves shown above it.</p></article><article><span>03</span><h2>INSPECTION</h2><p>Press Space, Enter, or touch the timer to begin inspection. Under 15 seconds is normal, 15 to under 17 seconds is +2, and 17 seconds or more is DNF.</p></article><article><span>04</span><h2>SOLVE</h2><p>Press again to start the solve, then press again when you finish. Your result is saved on this device.</p></article><article><span>05</span><h2>1V1 ROOMS</h2><p>For beta, rooms use a browser-to-browser WebRTC connection. The host and guest exchange connection data to connect.</p></article><article><span>06</span><h2>YOUR DATA</h2><p>Solves and settings stay in your browser. Use JSON export if you want a backup or to move your timer data.</p></article></div><div class="tutorial-actions"><button class="primary-btn" id="tutorialStart">I UNDERSTAND — OPEN MENU</button></div></div></div>`);document.querySelector("#tutorialStart").onclick=()=>{localStorage.setItem("cubeclash-tutorial-seen","1");home()}}
function dashboard(){v(`<div class="hero"><div class="hero-grid"><div><div class="section-title"><small>01 / SPEEDCUBING PLATFORM</small><small>BETA</small></div><h1 class="hero-title cube-font">CUBE<span>CLASH</span></h1><p class="hero-copy">A smooth responsive 2×2 and 3×3 speedcubing timer with random-state scrambles, real 3D scramble visualization, local history, installable PWA support, and peer-to-peer 1v1 rooms.</p><div class="hero-actions"><button class="primary-btn" data-view="solo">SOLO TIMER</button><button class="ghost-btn" data-view="room">CREATE / JOIN 1V1</button></div></div><div class="technical-card"><div class="spec-list"><div class="spec"><span>PUZZLES</span><span>2×2 / 3×3</span></div><div class="spec"><span>SCRAMBLES</span><span>RANDOM-STATE</span></div><div class="spec"><span>SYNC</span><span>WEBRTC P2P</span></div><div class="spec"><span>STORAGE</span><span>INDEXEDDB</span></div><div class="spec"><span>INSTALL</span><span>PWA</span></div></div></div></div></div>`)}
function home(){v(`<div class="menu-screen"><div class="menu-wrap"><section class="menu-main"><div class="menu-content"><div class="menu-kicker">WELCOME / CUBECLASH BETA</div><h1 class="menu-title">CUBE<span>CLASH</span></h1><p class="menu-sub">A competitive speedcubing platform for 2×2 and 3×3. Choose your appearance, then enter the timer or a 1v1 room.</p><div class="menu-actions"><button class="menu-action" data-view="solo"><span>SOLO TIMER</span><span class="arrow">→</span></button><button class="menu-action" data-view="room"><span>CREATE / JOIN 1V1</span><span class="arrow">→</span></button><button class="menu-action" data-view="settings"><span>SETTINGS</span><span class="arrow">→</span></button></div></div></section>${themePanel()}</div></div>`);bindTheme();applyTheme(savedTheme||"dark")}

function preopenMatchWindow(){
  if(s.matchWindow&&!s.matchWindow.closed)return s.matchWindow;
  try{s.matchWindow=window.open("about:blank","CubeClashMatch");if(s.matchWindow){s.matchWindow.document.title="CubeClash Match";s.matchWindow.document.body.innerHTML='<div style="margin:0;background:#050505;color:#fff;font:600 13px monospace;display:grid;place-items:center;height:100vh">CONNECTING TO CUBECLASH MATCH…</div>'}}catch(e){s.matchWindow=null}
  return s.matchWindow;
}
function openMatchWindow(){
  if(!s.matchWindow||s.matchWindow.closed)s.matchWindow=window.open("match.html","CubeClashMatch");
  if(s.matchWindow&&!s.matchWindow.closed){s.matchWindow.location.href="./match.html?role="+encodeURIComponent(s.role||"");s.matchWindow.focus();return true}
  toast("ALLOW POPUPS FOR THE MATCH WINDOW");return false;
}
function navigateMatchWindow(){
  if(!s.matchWindow||s.matchWindow.closed)return false;
  try{s.matchWindow.location.href="./match.html?role="+encodeURIComponent(s.role||"");s.matchWindow.focus();return true}catch(e){return false}
}
function exposeMatchBridge(){
  window.CubeClashBridge={get state(){return {role:s.role,roomCode:s.roomCode||"",scramble:s.scramble||"",match:s.match||null,opponent:s.opponent||{time:"0.00",status:"WAITING"},phase:s.matchPhase||"ready",theme:localStorage.getItem("cubeclash-theme")||"dark"}},get localStream(){return s.localStream||null},get remoteStream(){return s.remoteStream||null}};
}
exposeMatchBridge();
function room(){
  v(`<div class="room-page"><div class="section-title"><h1>1V1 ROOM</h1><small>LIVE WEBRTC / PEER-TO-PEER</small></div><div class="room-layout"><div class="room-card"><h2>CREATE ROOM</h2><p class="room-help">Create a room and share the short room code. You can open the match window after your opponent connects.</p><div class="form-grid"><div class="field"><label>PUZZLE</label><select id="rp"><option value="333">3×3</option><option value="222">2×2</option></select></div><div class="field"><label>ROUNDS</label><select id="rr"><option>3</option><option selected>5</option><option>7</option></select></div><div class="field"><label>INSPECTION</label><select id="ri"><option>15</option><option>10</option><option>0</option></select></div><div class="field"><label>FORMAT</label><select id="rf"><option>FIRST TO</option><option>BEST OF</option></select></div></div><div class="checks"><label class="check"><input id="rp2" type="checkbox" checked> +2</label><label class="check"><input id="rdnf" type="checkbox" checked> DNF</label></div><button class="primary-btn" id="create">CREATE ROOM</button><div id="hostRoom" class="room-code-box" hidden></div></div><div class="room-card"><h2>JOIN ROOM</h2><p class="room-help">Enter the room code shown by Player 1. No offer/answer strings are needed.</p><div class="field"><label>ROOM CODE</label><input id="roomCode" class="code-input" autocomplete="off" autocapitalize="characters" placeholder="e.g. A7K9P2QX"></div><button class="primary-btn" id="join">JOIN ROOM</button></div></div><div id="rs" class="empty">NO ACTIVE ROOM</div></div>`);
  document.querySelector("#create").onclick=createRoom;
  document.querySelector("#join").onclick=joinRoom;
}
function showRoomStatus(title,body="",kind=""){
  const e=document.querySelector("#rs");
  if(!e)return;
  e.className=`room-card ${kind}`;
  e.innerHTML=`<h2>${esc(title)}</h2>${body?`<p class="room-help">${esc(body)}</p>`:""}`;
}
function makeRoomCode(id){return id.slice(-8).toUpperCase()}
async function createRoom(){
  preopenMatchWindow();
  try{
    s.role="host";
    s.puzzle=document.querySelector("#rp").value;
    s.match={rounds:+document.querySelector("#rr").value,inspection:+document.querySelector("#ri").value,format:document.querySelector("#rf").value,allowPlus2:document.querySelector("#rp2").checked,allowDNF:document.querySelector("#rdnf").checked,round:1,score:[0,0],status:"WAITING",scramble:""};
    s.room=new P2PRoom("host");
    wireRoom();
    showRoomStatus("CREATING ROOM","Connecting to the room service…");
    const peerId=await s.room.createRoom();
    s.roomCode=makeRoomCode(peerId);
    const hostBox=document.querySelector("#hostRoom");
    if(hostBox){hostBox.hidden=false;hostBox.innerHTML=`<div class="room-code-label">ROOM CODE</div><div class="room-code">${esc(s.roomCode)}</div><button class="ghost-btn" id="copyRoomCode">COPY CODE</button>`;document.querySelector("#copyRoomCode").onclick=()=>copyText(s.roomCode)}
    showRoomStatus("ROOM READY","Give the room code to Player 2. Waiting for the connection…");
    appendRoomWindowButton();
    toast("ROOM CREATED");
  }catch(err){console.error(err);showRoomStatus("ROOM CREATION FAILED",err.message||String(err),"error");toast("CREATE ROOM FAILED")}
}
async function joinRoom(){
  preopenMatchWindow();
  try{
    const code=(document.querySelector("#roomCode")?.value||"").trim();
    if(!code)throw new Error("Enter the room code first.");
    s.role="guest";
    s.room=new P2PRoom("guest");
    wireRoom();
    showRoomStatus("CONNECTING",`Looking for room ${code.toUpperCase()}…`);
    const ok=await s.room.joinRoom(code);
    if(ok){showRoomStatus("CONNECTED","Waiting for the host to send the match setup…");appendRoomWindowButton();toast("PLAYER 1 CONNECTED")}
  }catch(err){console.error(err);showRoomStatus("JOIN FAILED",err.message||String(err),"error");toast("JOIN FAILED")}
}
function appendRoomWindowButton(){
  const e=document.querySelector("#rs");if(!e)return;
  const row=document.createElement("div");row.className="room-actions";row.innerHTML='<button class="ghost-btn" id="openMatchWindow">OPEN MATCH WINDOW</button>';e.appendChild(row);
  document.querySelector("#openMatchWindow").onclick=openMatchWindow;
}
function copyText(text){
  navigator.clipboard?.writeText(text).then(()=>toast("COPIED")).catch(()=>{const a=document.createElement("textarea");a.value=text;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();toast("COPIED")});
}
function wireRoom(){
  if(s.room._wired)return; s.room._wired=true;
  s.room.on("state",state=>{
    console.log("CubeClash room state",state);
    if(state==="connected"){
      if(s.role==="host"){
        if(!s.scramble) s.scramble=randomScramble();
        const config={type:"match-config",match:{...s.match,puzzle:s.puzzle},scramble:s.scramble};
        try{s.room.send(config)}catch(e){console.error(e)}
      }
      showCameraPermission();
      setTimeout(()=>navigateMatchWindow(),120);
    }
    if(state==="closed")showRoomStatus("PLAYER DISCONNECTED","The peer connection closed.","error");
    if(state==="signaling-disconnected")showRoomStatus("SIGNALING DISCONNECTED","The room service connection was lost. Existing P2P connections may continue.","error");
  }).on("state",state=>{
    if(state==="camera-requested"&&s.localStream&&s.role==="guest"){try{s.room.answerWithCamera(s.localStream)}catch(e){console.error(e)}}
  }).on("message",msg=>{
    if(!msg||typeof msg!=="object")return;
    if(msg.type==="match-config"&&s.role==="guest"){
      s.match=msg.match;s.puzzle=msg.match.puzzle;s.scramble=msg.scramble||randomScramble();
      renderMatch();
      toast("MATCH READY");
    }
    if(msg.type==="camera-ready"){s.remoteCameraReady=true;}
    if(msg.type==="camera-ready"&&s.role==="host"&&s.localStream){
      if(!s.cameraCallStarted){s.cameraCallStarted=true;s.room.startCameraCall(s.localStream).catch(e=>console.error(e))}
    }
    if(msg.type==="timer-start")setOpponentState("SOLVING",msg.startedAt);
    if(msg.type==="timer-inspection")setOpponentState("INSPECTION",msg.startedAt);
    if(msg.type==="timer-finish"){
      s.opponent.status=msg.display||"FINISHED";s.opponent.time=msg.display||"—";updateMatchUI();
      if(s.role==="host"&&msg.display!=="DNF")s.match.score[1]+=1;
    }
    if(msg.type==="match-reset")renderMatch();
  }).on("stream",stream=>{
    s.remoteStream=stream;exposeMatchBridge();const v=document.querySelector("#remoteVideo");if(v){v.srcObject=stream;v.play().catch(()=>{})}
    updateCameraState("OPPONENT CAMERA CONNECTED");
  }).on("error",err=>{console.error("CubeClash P2P error",err);toast(err.message||String(err));});
  if(s.room.peer)s.room.peer.on("connection",()=>{});
}
async function requestCamera(){
  if(s.localStream)return s.localStream;
  if(!navigator.mediaDevices?.getUserMedia){toast("CAMERA IS NOT AVAILABLE IN THIS BROWSER");return null}
  try{
    s.localStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:false});
    exposeMatchBridge();
    const local=document.querySelector("#localVideo");
    if(local){local.srcObject=s.localStream;local.play().catch(()=>{})}
    return s.localStream;
  }catch(err){
    console.warn("CubeClash camera permission:",err);
    return null;
  }
}
async function sendCameraReady(){
  if(!s.room||!s.localStream)return;
  try{s.room.send({type:"camera-ready"})}catch(e){console.error(e)}
  if(s.room.call&&s.role==="guest"){try{s.room.answerWithCamera(s.localStream)}catch(e){console.error(e)}}
  if(s.role==="host"&&s.room.conn?.peer&&s.remoteCameraReady&&!s.cameraCallStarted){
    s.cameraCallStarted=true;
    s.room.startCameraCall(s.localStream).catch(e=>{s.cameraCallStarted=false;console.error(e)});
  }
}
async function showCameraPermission(){
  renderMatch(true);
  const modal=document.querySelector("#cameraModal");if(!modal)return;
  if(s.localStream){
    modal.hidden=true;
    updateCameraState("CAMERA READY");
    await sendCameraReady();
    return;
  }
  modal.hidden=false;
  document.querySelector("#allowCamera").onclick=async()=>{
    const stream=await requestCamera();
    if(!stream){updateCameraState("CAMERA BLOCKED — ALLOW CAMERA IN BROWSER SETTINGS");toast("CAMERA PERMISSION DENIED");return}
    modal.hidden=true;
    updateCameraState("CAMERA READY");
    await sendCameraReady();
  };
  document.querySelector("#skipCamera").onclick=()=>{modal.hidden=true;updateCameraState("CAMERA OFF")};
}
function renderMatch(preconnect=false){
  v(`<div class="match-page"><div class="match-head"><div><div class="section-title" style="margin:0"><h1>1V1 MATCH</h1><small>${s.role==="host"?"PLAYER 1 / HOST":"PLAYER 2 / GUEST"}</small></div></div><div class="match-meta"><span id="matchRound">ROUND ${s.match?.round||1}</span><span id="matchScore">${s.match?.score?.[0]||0} — ${s.match?.score?.[1]||0}</span><button class="ghost-btn" data-view="home">EXIT</button></div></div><div class="video-row"><div class="video-card"><div class="video-label">YOU</div><video id="localVideo" autoplay muted playsinline></video><div class="video-state" id="localCamState">CAMERA WAITING</div></div><div class="video-card"><div class="video-label">OPPONENT</div><video id="remoteVideo" autoplay playsinline></video><div class="video-state" id="remoteCamState">WAITING FOR CAMERA</div></div></div><div class="match-grid"><div class="player-card"><div class="player-name">${s.role==="host"?"PLAYER 1":"PLAYER 2"}</div><div class="player-state"><div class="player-timer" id="myTimer">0.00</div><small id="myState">READY</small></div><div class="match-controls"><button class="primary-btn" id="matchStart">START</button><button class="ghost-btn" id="matchDone">FINISH</button></div></div><div class="center-match"><div class="center-scramble">${esc(s.scramble||"WAITING FOR SCRAMBLE")}</div><div class="center-cube">${cube()}</div><div class="match-controls"><span class="match-connection" id="matchConnection">${preconnect?"CONNECTING":"CONNECTED"}</span></div></div><div class="player-card"><div class="player-name">${s.role==="host"?"PLAYER 2":"PLAYER 1"}</div><div class="player-state"><div class="player-timer" id="oppTimer">${s.opponent.time||"0.00"}</div><small id="oppState">${s.opponent.status||"WAITING"}</small></div><div></div></div></div><div class="camera-modal" id="cameraModal" hidden><div class="camera-modal-card"><div class="room-code-label">MATCH CAMERA</div><h2>ALLOW CAMERA</h2><p>Both players are connected. Allow CubeClash to use your camera for the 1v1 match.</p><div class="room-actions"><button class="primary-btn" id="allowCamera">ALLOW CAMERA</button><button class="ghost-btn" id="skipCamera">CONTINUE WITHOUT CAMERA</button></div></div></div></div>`);
  mountCube();
  if(s.localStream){const v=document.querySelector("#localVideo");if(v)v.srcObject=s.localStream}
  if(s.remoteStream){const v=document.querySelector("#remoteVideo");if(v)v.srcObject=s.remoteStream}
  document.querySelector("#matchStart").onclick=matchStart;
  document.querySelector("#matchDone").onclick=matchFinish;
  window.onkeydown=e=>{if((e.code==="Space"||e.code==="Enter")&&!e.repeat){e.preventDefault();matchToggle()}};
  updateCameraState(s.localStream?"CAMERA READY":"CAMERA WAITING");
}
function updateCameraState(text){const e=document.querySelector("#localCamState");if(e)e.textContent=text}
function setOpponentState(status,time){s.opponent.status=status;if(time)s.opponent.startedAt=time;updateMatchUI()}
function updateMatchUI(){exposeMatchBridge();const t=document.querySelector("#oppTimer"),st=document.querySelector("#oppState");if(t)t.textContent=s.opponent.time||"0.00";if(st)st.textContent=s.opponent.status||"WAITING";const sc=document.querySelector("#matchScore");if(sc)sc.textContent=`${s.match?.score?.[0]||0} — ${s.match?.score?.[1]||0}`}
function matchStart(){exposeMatchBridge();if(s.matchPhase&&s.matchPhase!=="ready")return;s.matchPhase="solving";s.matchSolveStart=performance.now();s.room?.send({type:"timer-start",startedAt:Date.now()});document.querySelector("#myState").textContent="SOLVING";matchLoop()}
function matchToggle(){if(s.matchPhase==="solving")matchFinish();else matchStart()}
function matchLoop(){if(s.matchPhase!=="solving")return;const ms=performance.now()-s.matchSolveStart;const e=document.querySelector("#myTimer");if(e)e.textContent=fmt(ms);s.matchRaf=requestAnimationFrame(matchLoop)}
function matchFinish(){exposeMatchBridge();if(s.matchPhase!=="solving")return;cancelAnimationFrame(s.matchRaf);const ms=performance.now()-s.matchSolveStart;s.matchPhase="finished";const display=fmt(ms);s.opponent.self=display;const e=document.querySelector("#myTimer");if(e)e.textContent=display;const st=document.querySelector("#myState");if(st)st.textContent="FINISHED";try{s.room?.send({type:"timer-finish",display})}catch{}if(s.role==="host"){s.match.score[0]+=1;updateMatchUI()}}

function settingsView(){v(`<div class="section-title"><h1>SETTINGS</h1><small>LOCAL DEVICE</small></div><div class="settings-grid"><div class="setting-card"><h2>APPEARANCE</h2><div class="theme-options" style="margin-top:14px"><button class="theme-option" data-theme="dark"><div class="theme-preview dark"></div><strong>DARK</strong><small>OBSIDIAN / HIGH CONTRAST</small></button><button class="theme-option" data-theme="light"><div class="theme-preview light"></div><strong>WHITE</strong><small>CLEAN / LIGHT GRID</small></button></div></div><div class="setting-card"><h2>TIMER</h2><div class="field"><label>INSPECTION SECONDS</label><select id="ins"><option ${settings.inspection===0?"selected":""}>0</option><option ${settings.inspection===10?"selected":""}>10</option><option ${settings.inspection===15?"selected":""}>15</option></select></div><div class="room-actions"><button class="primary-btn" id="save">SAVE SETTINGS</button></div></div><div class="setting-card"><h2>DATA</h2><p style="color:#666;font-size:12px;line-height:1.6">Solves are stored locally in IndexedDB. Export your times before clearing browser data or moving to another device.</p><div class="room-actions"><button class="ghost-btn" id="ex">EXPORT JSON</button><label class="ghost-btn" style="display:grid;place-items:center;cursor:pointer">IMPORT JSON<input id="im" type="file" accept=".json" hidden></label><button class="danger-btn" id="cl">CLEAR SOLVES</button></div></div><div class="setting-card wipe-card"><h2>RESET / UPDATE</h2><p style="color:#666;font-size:12px;line-height:1.6">Use this when a new CubeClash update is installed and the old service worker or cached files are causing problems. CubeClash will automatically download a JSON backup of your solve history first, then clear local app data, caches, and the service worker.</p><div class="room-actions"><button class="danger-btn" id="wipeAll">EXPORT + WIPE APP DATA</button></div></div></div>`);bindTheme();applyTheme(localStorage.getItem("cubeclash-theme")||"dark");document.querySelector("#save").onclick=()=>{settings.inspection=+document.querySelector("#ins").value;localStorage.setItem("cubeclash-settings",JSON.stringify(settings));toast("SETTINGS SAVED")};document.querySelector("#ex").onclick=async()=>{const b=new Blob([JSON.stringify(await exportData(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`cubeclash-${Date.now()}.json`;a.click()};document.querySelector("#im").onchange=async e=>{try{await importData(JSON.parse(await e.target.files[0].text()));toast("DATA IMPORTED")}catch{toast("IMPORT FAILED")}};document.querySelector("#cl").onclick=async()=>{if(confirm("Clear all local solves? This cannot be undone unless you exported them.")){await clearSolves();toast("SOLVES CLEARED")}};document.querySelector("#wipeAll").onclick=async()=>{if(!confirm("CubeClash will export your solve history and then clear local app data, cache, settings, and service worker. Continue?"))return;try{await wipeCubeClashData({downloadBackup:true});alert("Backup downloaded. CubeClash will reload with a clean installation.");location.reload()}catch(e){console.error(e);toast("RESET FAILED")}}}
async function nav(x){if(x==="home")home();if(x==="solo")await solo();if(x==="room")room();if(x==="settings")settingsView()}document.addEventListener("click",e=>{const x=e.target.closest("[data-view]");if(x)nav(x.dataset.view)});window.addEventListener("online",()=>{document.querySelector("#networkText").textContent="ONLINE"});window.addEventListener("offline",()=>{document.querySelector("#networkText").textContent="OFFLINE"});window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;document.querySelector("#installBtn").hidden=false});document.querySelector("#installBtn").onclick=async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null}};if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./service-worker.js");
// Ask for camera permission as soon as CubeClash loads. The browser will show its own permission prompt.
requestCamera().catch(()=>{});
if(localStorage.getItem("cubeclash-tutorial-seen")==="1")home();else tutorial();
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
