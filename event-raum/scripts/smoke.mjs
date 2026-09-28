const base = process.env.BASE_URL || 'http://127.0.0.1:8787';
const origin = new URL(base).origin;
async function call(path,body) { const response = await fetch(base + '/api' + path,{method:body?'POST':'GET',headers:body?{'Origin':origin,'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}); return {status:response.status,body:await response.json()}; }
function assert(condition,message) { if(!condition) throw Error(message); console.log('✓ '+message); }
const events = (await call('/events')).body.events;
assert(events.length >= 2,'public events load');
assert(!('discount_code' in events[0]),'discount codes are not published');
const paid = events.find(e=>e.guest_price>0), free = events.find(e=>e.guest_price===0);
const suffix = crypto.randomUUID().slice(0,8);
const guest = {kind:'guest',first_name:'Smoke',last_name:'Test',email:`smoke-${suffix}@example.invalid`,company:'Test',phone:'',photo_consent:false,guest_rule_consent:true};
const billing={name:'Smoke Test',street:'Testweg 1',postal:'12345',city:'Teststadt',country:'Deutschland'};
const baseReg={people:[guest],billing,privacy_consent:true,submission_key:crypto.randomUUID()};
const rejected=await call('/register',{...baseReg,event_id:paid.id,people:[{...guest,guest_rule_consent:false}]});
assert(rejected.status===400,'missing guest consent rejected');
const registration=await call('/register',{...baseReg,event_id:paid.id});
assert(registration.status===201 && registration.body.registration.status==='pending' && registration.body.registration.payment_status==='awaiting_payment','paid registration remains unconfirmed');
const duplicate=await call('/register',{...baseReg,submission_key:crypto.randomUUID(),event_id:paid.id});
assert(duplicate.status===409,'duplicate event email rejected');
const ref=registration.body.registration.id,code=registration.body.access_code;
assert((await call('/lookup',{id:ref,access_code:'wrong'})).status===404,'wrong access code rejected');
assert((await call('/lookup',{id:ref,access_code:code})).status===200,'access code retrieves registration');
assert((await call('/cancel',{id:ref,access_code:code})).body.registration.status==='cancelled','pending registration can be withdrawn');
assert((await call('/cancel',{id:ref,access_code:code})).status===409,'double cancellation rejected');
const freeReg=await call('/register',{...baseReg,event_id:free.id,submission_key:crypto.randomUUID()});
assert(freeReg.status===201 && freeReg.body.registration.status==='confirmed' && freeReg.body.registration.payment_status==='not_required','free registration confirms without payment');
assert((await call('/cancel',{id:freeReg.body.registration.id,access_code:freeReg.body.access_code})).status===200,'free registration can be cancelled');
assert((await call('/admin/overview')).status===401,'admin data requires session');
console.log('All smoke checks passed.');
