import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Alarm} from '../alarm.js';
import {Timer} from '../timer.js';
function audioContext(){
 const tones=[];
 const context={state:'suspended',currentTime:10,destination:{},resume:async()=>{context.state='running';},createOscillator:()=>{const tone={frequency:{value:0},connect(){},disconnect(){},start(time){this.started=time;},stop(time){this.stopped=time;}};tones.push(tone);return tone;},createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}})};
 return {context,tones};
}
test('a completed timer resumes audio and schedules a clear sequence of beeps',async()=>{const {context,tones}=audioContext();const alarm=new Alarm(()=>context);await alarm.ring();assert.equal(context.state,'running');assert.equal(tones.length,6);assert.ok(tones.every(t=>t.frequency.value===880&&t.stopped>t.started));});
test('a blocked alarm stays pending and beeps once after the next interaction',async()=>{const {context,tones}=audioContext();context.resume=async()=>{throw Error('gesture needed');};const alarm=new Alarm(()=>context);await alarm.ring();assert.equal(tones.length,0);context.resume=async()=>{context.state='running';};await alarm.unlock();await alarm.unlock();assert.equal(tones.length,6);});
test('turning sound off cancels a pending alarm',async()=>{const {context,tones}=audioContext();const alarm=new Alarm(()=>context);alarm.setEnabled(false);await alarm.ring();await alarm.unlock();assert.equal(tones.length,0);});
test('focus, short break and long break each trigger one beep sequence at completion',async()=>{
 for(const mode of ['focus','short','long']){const {context,tones}=audioContext();const alarm=new Alarm(()=>context);const timer=new Timer();timer.select(mode);timer.start(1000);if(timer.tick(1000+timer.total))await alarm.ring();if(timer.tick(2000+timer.total))await alarm.ring();assert.equal(tones.length,6,mode);}
});
