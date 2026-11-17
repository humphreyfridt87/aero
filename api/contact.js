const DESTINATION = 'humphrey@growthartistmgmt.com';
const intents = new Set(['Brainstorm session', 'Quote request']);
const categories = new Set(['','Festival / outdoor event','Indoor event / arena','Artist / tour','Brand activation','Stage design partnership','Other']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function error(res, code, message) { return res.status(code).json({error:message}); }
function clean(value, max=150) {return typeof value === 'string' ? value.trim().slice(0,max) : '';}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST') {res.setHeader('Allow','POST');return error(res,405,'Method not allowed');}
  if(Number(req.headers['content-length']||0)>12000) return error(res,413,'Request too large');
  const d=req.body;
  if(!d || typeof d!=='object' || Array.isArray(d)) return error(res,400,'Invalid request');
  // Honeypot: do not send mail for obvious bots.
  if(d.website) return error(res,400,'Invalid submission');
  const name=clean(d.name,120),email=clean(d.email,180),intent=clean(d.intent,40);
  const organization=clean(d.organization,150),projectType=clean(d.projectType,60);
  const eventDate=clean(d.eventDate,10),message=clean(d.message,3000);
  if(!name || !emailPattern.test(email) || !intents.has(intent) || message.length<10 || message.length>3000 || !categories.has(projectType)) return error(res,400,'Please check the required fields');
  if(d.message.length>3000 || d.name.length>120 || d.email.length>180) return error(res,400,'Field too long');
  if(eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return error(res,400,'Invalid event date');
  const {RESEND_API_KEY,CONTACT_FROM_EMAIL,TURNSTILE_SECRET_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN}=process.env;
  if(!RESEND_API_KEY || !CONTACT_FROM_EMAIL || !TURNSTILE_SECRET_KEY || !UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return error(res,503,'Contact form is temporarily unavailable. Please email us directly.');
  const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim() || 'unknown';
  try {
    // Persistent IP rate limiting, shared across Vercel function instances. No lead database.
    const key='aero:contact:limit:'+ip;
    const limitResp=await fetch(UPSTASH_REDIS_REST_URL+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['INCR',key],['EXPIRE',key,3600,'NX']]),signal:AbortSignal.timeout(5000)});
    if(!limitResp.ok) throw Error('Rate limiter unavailable');
    const results=await limitResp.json();
    if(results?.[0]?.error || results?.[1]?.error || !Number.isFinite(Number(results?.[0]?.result))) throw Error('Rate limiter failed');
    if(Number(results[0].result)>5) return error(res,429,'Too many requests. Please try again later.');
    const token=clean(d.turnstileToken,2500);
    if(!token) return error(res,400,'Please complete the spam check');
    const params=new URLSearchParams({secret:TURNSTILE_SECRET_KEY,response:token,remoteip:ip});
    const check=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:params,signal:AbortSignal.timeout(6000)});
    if(!check.ok) throw Error('Spam check unavailable');
    const result=await check.json();
    if(!result.success) return error(res,400,'Spam verification failed. Please retry.');
    // Optional domain binding protects against tokens from unrelated sites.
    if(process.env.ALLOWED_HOSTNAME && result.hostname!==process.env.ALLOWED_HOSTNAME) return error(res,403,'Invalid form origin');
    const body=[['Inquiry',intent],['Name',name],['Organization',organization||'-'],['Email',email],['Project type',projectType||'-'],['Event date',eventDate||'-'],['Message',message]].map(([k,v])=>k+': '+v).join('\n');
    const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:CONTACT_FROM_EMAIL,to:[DESTINATION],reply_to:email,subject:'AERO — '+intent,text:body}),signal:AbortSignal.timeout(10000)});
    if(!sent.ok) {console.error('Resend delivery rejected',sent.status);return error(res,502,'We could not send your request. Please contact us by email.');}
    return res.status(200).json({ok:true});
  } catch(e) {console.error('AERO contact endpoint:',e.message);return error(res,503,'Contact form is temporarily unavailable. Please email us directly.');}
}
