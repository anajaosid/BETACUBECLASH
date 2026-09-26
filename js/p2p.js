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
  on(type,fn){(this.handlers[type]??=[]).push(fn);return this}
  emit(type,data){for(const fn of this.handlers[type]??[])fn(data)}
  attach(channel){
    this.channel=channel;
    channel.onopen=()=>this.emit("state","connected");
    channel.onclose=()=>this.emit("state","closed");
    channel.onerror=e=>this.emit("error",e);
    channel.onmessage=e=>{try{this.emit("message",JSON.parse(e.data))}catch(err){this.emit("error",err)}};
  }
  async waitIce(){
    if(this.pc.iceGatheringState==="complete") return;
    await new Promise(resolve=>{
      let finished=false;
      const finish=()=>{
        if(finished)return;
        finished=true;
        this.pc.removeEventListener("icegatheringstatechange",onState);
        resolve();
      };
      const onState=()=>{if(this.pc.iceGatheringState==="complete")finish()};
      this.pc.addEventListener("icegatheringstatechange",onState);
      setTimeout(finish,5000);
    });
  }
  async createOffer(){
    this.attach(this.pc.createDataChannel("cubeclash",{ordered:true}));
    const offer=await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.waitIce();
    return encode(this.pc.localDescription);
  }
  async acceptOffer(value){
    await this.pc.setRemoteDescription(decode(value));
    const answer=await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.waitIce();
    return encode(this.pc.localDescription);
  }
  async acceptAnswer(value){
    await this.pc.setRemoteDescription(decode(value));
  }
  send(value){
    if(this.channel?.readyState!=="open") throw new Error("Data channel is not connected");
    this.channel.send(JSON.stringify(value));
  }
  close(){this.channel?.close();this.pc.close()}
}

function encode(value){
  const json=JSON.stringify(value);
  const bytes=new TextEncoder().encode(json);
  let binary="";
  for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
}
function decode(value){
  const binary=atob(value.trim());
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export const link=(kind,data)=>{
  const clean=encodeURIComponent(data);
  return `${location.origin}${location.pathname}#${kind}=${clean}`;
};
