export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const siteKey=process.env.TURNSTILE_SITE_KEY;
  return siteKey?res.status(200).json({siteKey}):res.status(503).json({error:'Spam protection not configured'});
}
