const STUN=[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun.cloudflare.com:3478"}];
export class P2PRoom{
 constructor(){if(!window.RTCPeerConnection)throw new Error("WebRTC is not supported by this browser.");this.pc=new RTCPeerConnection({iceServers:STUN});this.channel=null;this.handlers={message:[],state:[],error:[]};this.pc.onconnectionstatechange=()=>this.emit("state",this.pc.connectionState);this.pc.oniceconnectionstatechange=()=>this.emit("ice",this.pc.iceConnectionState);this.pc.ondatachannel=e=>this.attach(e.channel)}
 on(t,f){(this.handlers[t]??=[]).push(f);return this} emit(t,d){for(const f of this.handlers[t]??[])try{f(d)}catch(e){console.error(e)}}
 attach(ch){this.channel=ch;ch.onopen=()=>this.emit("state","connected");ch.onclose=()=>this.emit("state","closed");ch.onerror=e=>this.emit("error",e);ch.onmessage=e=>{try{this.emit("message",JSON.parse(e.data))}catch(err){this.emit("error",err)}}}
 async waitIce(){if(this.pc.iceGatheringState==="complete")return;await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);this.pc.removeEventListener("icegatheringstatechange",check);resolve()};const check=()=>{if(this.pc.iceGatheringState==="complete")finish()};const timer=setTimeout(finish,12000);this.pc.addEventListener("icegatheringstatechange",check)})}
 async createOffer(){this.attach(this.pc.createDataChannel("cubeclash",{ordered:true}));const offer=await this.pc.createOffer();await this.pc.setLocalDescription(offer);await this.waitIce();if(!this.pc.localDescription?.sdp)throw new Error("WebRTC did not produce an offer.");return encode(this.pc.localDescription)}
 async acceptOffer(value){const offer=decode(value);if(offer.type!=="offer")throw new Error("This is not a Player 1 offer.");await this.pc.setRemoteDescription(offer);const answer=await this.pc.createAnswer();await this.pc.setLocalDescription(answer);await this.waitIce();if(!this.pc.localDescription?.sdp)throw new Error("WebRTC did not produce an answer.");return encode(this.pc.localDescription)}
 async acceptAnswer(value){const answer=decode(value);if(answer.type!=="answer")throw new Error("This is not a Player 2 answer.");await this.pc.setRemoteDescription(answer)}
 send(v){if(this.channel?.readyState!=="open")throw new Error("Data channel is not connected yet.");this.channel.send(JSON.stringify(v))}
 close(){try{this.channel?.close();this.pc.close()}catch{}}
}
function encode(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v))))}
function decode(v){return JSON.parse(decodeURIComponent(escape(atob(v.trim()))))}
export const link=(kind,data)=>`${location.origin}${location.pathname}#${kind}=${encodeURIComponent(data)}`;
