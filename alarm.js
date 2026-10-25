export class Alarm {
  constructor(createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),onStatus=()=>{}) {
    this.createContext=createContext;this.onStatus=onStatus;this.enabled=true;this.pending=false;this.context=null;this.tones=[];
  }
  setEnabled(enabled) {
    this.enabled=enabled;
    if(!enabled){this.pending=false;this.tones.forEach(tone=>{try{tone.stop();}catch{}});this.tones=[];}
  }
  async unlock() {
    if(!this.enabled)return false;
    try {
      if(!this.context||this.context.state==='closed')this.context=this.createContext();
      if(this.context.state!=='running')await this.context.resume();
      if(this.context.state!=='running')throw new Error('Audio is suspended');
      if(!this.enabled)return false;
      if(this.pending){this.pending=false;this.beep();}
      return true;
    }catch{this.onStatus('Sound needs a click to start. Press Test beep to enable it.');return false;}
  }
  async ring() {
    if(!this.enabled)return;
    this.pending=true;
    await this.unlock();
  }
  beep() {
    const audio=this.context;
    // Two groups of three distinct beeps, with short ramps to avoid clicks.
    [0,.35,.70,1.35,1.70,2.05].forEach(offset=>{
      const tone=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+.02+offset;
      tone.type='square';tone.frequency.value=880;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.08,start+.008);gain.gain.setValueAtTime(.08,start+.16);gain.gain.linearRampToValueAtTime(0,start+.18);
      tone.connect(gain);gain.connect(audio.destination);
      tone.onended=()=>{tone.disconnect();gain.disconnect();this.tones=this.tones.filter(item=>item!==tone);};
      this.tones.push(tone);tone.start(start);tone.stop(start+.20);
    });
    this.onStatus('Beep played.');
  }
}
