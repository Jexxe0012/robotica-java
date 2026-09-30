const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function progressAPI(request, env, allowedIds) {
  const user = request.headers.get('oai-authenticated-user-id');
  if (!user) return json({error:'Inicia sesión para guardar tu avance.'},401);
  if (!env.DB) return json({error:'El guardado no está disponible. Puedes continuar y reintentar.'},503);
  try {
    if (request.method === 'GET') {
      const [completion, current] = await Promise.all([env.DB.prepare('SELECT mission_id FROM completed_missions WHERE user_id = ?').bind(user).all(),env.DB.prepare('SELECT last_mission FROM learning_progress WHERE user_id = ?').bind(user).first()]);
      return json({completed:completion.results.map(row=>row.mission_id).filter(id=>allowedIds.has(id)),lastMission:allowedIds.has(current?.last_mission)?current.last_mission:null});
    }
    if (request.method !== 'POST') return json({error:'Método no permitido.'},405);
    const origin=request.headers.get('origin');
    if (origin && origin!==new URL(request.url).origin) return json({error:'Origen no permitido.'},403);
    if (request.headers.get('sec-fetch-site')==='cross-site') return json({error:'Origen no permitido.'},403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Se esperaba JSON.'},415);
    const raw=await request.text();if(raw.length>12000)return json({error:'Solicitud demasiado grande.'},413);
    let data;try{data=JSON.parse(raw);}catch{return json({error:'Solicitud no válida.'},400);}
    if(!data || !allowedIds.has(data.mission) || !Array.isArray(data.completed) || data.completed.length>90 || data.completed.some(id=>!allowedIds.has(id)))return json({error:'Misión o progreso no válido.'},400);
    const now=Date.now();
    const queries=[...new Set(data.completed)].map(id=>env.DB.prepare('INSERT INTO completed_missions (user_id, mission_id, completed_at) VALUES (?, ?, ?) ON CONFLICT (user_id, mission_id) DO NOTHING').bind(user,id,now));
    queries.push(env.DB.prepare('INSERT INTO learning_progress (user_id, last_mission, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET last_mission = excluded.last_mission, updated_at = excluded.updated_at').bind(user,data.mission,now));
    await env.DB.batch(queries);return json({saved:true});
  } catch(error) {console.error('Progress storage unavailable:',error.message);return json({error:'No pudimos guardar el avance. Conservamos los cambios en esta sesión para reintentarlo.'},503);}
}
