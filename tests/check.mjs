import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {progressAPI} from '../server/api.js';
import '../web/engine.js';import '../web/lessons.js';import '../web/export.js';
const {levels,chapters,grade}=JavaCourse;
assert.equal(levels.length,90);assert.equal(new Set(levels.map(m=>m.id)).size,90);
assert.equal(chapters.length,9);
await mkdir('.sites-runtime/java',{recursive:true});
let wrong=0;
for(const m of levels){
 const result=RobotJava.execute(m.solution,m.initial);
 assert.equal(result.error,null,`${m.id}: ${JSON.stringify(result.error)}`);
 assert.equal(grade(m,result,m.solution),true,`${m.id} solution misses goal`);
 assert(result.trace.length>0&&result.trace.length<1201);
 if(['fix','write','project'].includes(m.mode)){assert.equal(grade(m,RobotJava.execute(m.code,m.initial),m.code),false,`${m.id} starter already passes`);wrong++;}
 if(m.mode==='predict'){assert(m.choices.length>=3);assert(m.answer<m.choices.length);assert(m.expectedGoal);}
 if(m.mode==='order'){assert.equal(m.chunks.join('\n'),m.solution,`${m.id} Parsons incomplete`);const starter=JavaCourse.orderStart(m).join('\n');assert(!grade(m,RobotJava.execute(starter,m.initial),starter),`${m.id} initial ordering passes`);wrong++;}
 const exported=JavaExport.exportJava(m,m.solution);assert(exported.includes('public class Mision'));assert(exported.includes('static void jugar('));
 await mkdir(`.sites-runtime/java/${m.id}`,{recursive:true});await writeFile(`.sites-runtime/java/${m.id}/Mision.java`,exported);
}
const run=code=>RobotJava.execute(code);
function reject(code,pattern){const r=run(code);assert(r.error,code);assert.match(r.error.message,pattern);}
reject('int x = 2.5;',/tipo int/);
reject('boolean b = 1;',/boolean/);
reject('if (1) { robot.este(); }',/boolean/);
reject('int x = 4 / 0;',/cero/);
reject('int[] a = new int[]{1}; System.out.println(a[1]);',/límites/);
reject('Robot r = null; r.este();',/null/);
reject('while (true) {}',/160/);
reject('for (int i = 0; i < 100; i++) { Robot nuevo = new Robot("R"); }',/80 objetos/);
reject('class A extends B {} class B extends A {}',/ciclo/);
reject('class A extends Desconocido {}',/no existe/);
reject('class A { private int x = 1; } A a = new A(); System.out.println(a.x);',/private/);
reject('for (int i = 0; i < 1; i++) {} System.out.println(i);',/alcance/);
reject('static void f() { f(); } f();',/anidadas/);
reject('int x = 1; int x = 2;',/ya está/);
assert.deepEqual(run('Robot r = null; boolean b = r != null && r.puedeAvanzar(); System.out.println(b);').final.output,['false']);
assert.deepEqual(run('static void f(int x) { x++; } int n = 2; f(n); System.out.println(n);').final.output,['2']);
const methodTrace=run('static void f(int x) { x++; } int n = 2; f(n);');
const returned=methodTrace.trace.find(e=>e.message.startsWith('Vuelves de f'));
assert(returned.vars.n);assert(!returned.vars.x);assert.deepEqual(returned.stack,['jugar']);
assert.deepEqual(run('Robot a = robot; Robot b = new Robot("Otro"); a.este(); System.out.println(a == robot); System.out.println(a == b);').final.output,['true','false']);
const interrupted=run('robot.este(); robot.recoger();');assert.equal(interrupted.initial.objects[0].robot.x,0);assert.equal(interrupted.final.objects[0].robot.x,1);assert.equal(interrupted.trace.length,1);
const identity=run(levels[54].solution);assert.equal(identity.final.vars.a.objectId,identity.final.vars.b.objectId);
// Real SQLite, using the same prepared statements and batch transaction as D1.
const db=new DatabaseSync(':memory:');for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(await readFile('drizzle/'+file,'utf8'));
const binding={prepare(sql){let values=[];return {bind(...v){values=v;return this;},async all(){return {results:db.prepare(sql).all(...values)};},async first(){return db.prepare(sql).get(...values)??null;},run(){return db.prepare(sql).run(...values);}};},async batch(queries){db.exec('BEGIN');try{const rows=queries.map(q=>q.run());db.exec('COMMIT');return rows;}catch(e){db.exec('ROLLBACK');throw e;}}};
const ids=new Set(levels.map(m=>m.id));
const request=(method,user='test-a',data,headers={})=>new Request('https://test.example/api/progress',{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(data?{'content-type':'application/json'}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});
const api=req=>progressAPI(req,{DB:binding},ids);
assert.equal((await api(request('GET',null))).status,401);
assert.equal((await api(request('POST','test-a',{mission:'m01',completed:['m01','m52']}))).status,200);
assert.equal((await api(request('POST','test-a',{mission:'m02',completed:[]}))).status,200);
assert.deepEqual((await (await api(request('GET'))).json()).completed.sort(),['m01','m52']);
assert.deepEqual((await (await api(request('GET','test-b'))).json()).completed,[]);
assert.equal((await api(request('POST','test-a',{mission:'m99',completed:[]}))).status,400);
assert.equal((await api(request('POST','test-a',{mission:'m01',completed:['invalid']}))).status,400);
assert.equal((await api(request('POST','test-a',{mission:'m01',completed:[]},{origin:'https://evil.example'}))).status,403);
assert.equal((await api(request('POST','test-a',{mission:'m01',completed:[]},{'sec-fetch-site':'cross-site'}))).status,403);
assert.equal((await api(request('DELETE'))).status,405);
assert.equal((await progressAPI(request('GET'),{},ids)).status,503);
assert.equal((await api(new Request('https://test.example/api/progress',{method:'POST',headers:{'oai-authenticated-user-id':'test-a','content-type':'application/json'},body:'{oops'}))).status,400);
const oldError=console.error;console.error=()=>{};try{assert.equal((await progressAPI(request('GET'),{DB:{prepare(){throw new Error('offline');}}},ids)).status,503);}finally{console.error=oldError;}
db.close();
console.log(`PASS: 90 reference solutions, ${wrong} unsolved starters/orderings, Java semantics and isolated persistent progress.`);
