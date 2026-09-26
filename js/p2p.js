const STUN=[
  {urls:"stun:stun.l.google.com:19302"},
  {urls:"stun:stun1.l.google.com:19302"},
  {urls:"stun:stun.cloudflare.com:3478"}
];
export class P2PRoom{
  constructor(){
    this.pc=new RTCPeerConnection({iceServers:STUN});
    this.channel=null;
    this.handlers={message:[],state:[],error:[]};
    this.pc.onconnectionstatechange=()=>this.emit("state",this.pc.connectionState);
    this.pc.oniceconnectionstatechange=()=>this.emit("state",this.pc.iceConnectionState);
    this.pc.ondatachannel=e=>this.attach(e.channel);
  }
  on(t,f){(this.handlers[t]??=[]).push(f);return this}
  emit(t,d){for(const f of this.handlers[t]??[])f(d)}
  attach(c){
    this.channel=c;
    c.onopen=()=>this.emit("state","connected");
    c.onclose=()=>this.emit("state","closed");
    c.onerror=e=>this.emit("error",e);
    c.onmessage=e=>{try{this.emit("message",JSON.parse(e.data))}catch(err){this.emit("error",err)}};
  }
  async waitIce(){
    if(this.pc.iceGatheringState==="complete")return;
    await new Promise(resolve=>{
      const done=()=>{this.pc.removeEventListener("icegatheringstatechange",done);resolve()};
      this.pc.addEventListener("icegatheringstatechange",()=>{if(this.pc.iceGatheringState==="complete")done()});
      setTimeout(done,8000);
    });
  }
  async createOffer(){
    this.attach(this.pc.createDataChannel("cubeclash",{ordered:true}));
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await this.waitIce();
    return encode(this.pc.localDescription);
  }
  async acceptOffer(v){
    await this.pc.setRemoteDescription(decode(v));
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await this.waitIce();
    return encode(this.pc.localDescription);
  }
  async acceptAnswer(v){await this.pc.setRemoteDescription(decode(v));}
  send(x){if(this.channel?.readyState==="open")this.channel.send(JSON.stringify(x));}
  close(){this.channel?.close();this.pc.close();}
}
function encode(x){return btoa(unescape(encodeURIComponent(JSON.stringify(x))))}
function decode(x){return JSON.parse(decodeURIComponent(escape(atob(x))))}
export const link=(kind,data)=>`${location.origin}${location.pathname}#${kind}=${encodeURIComponent(data)}`;
