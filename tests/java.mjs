// Optional integration check. Supply the absolute directory of a local JDK.
import assert from 'node:assert/strict';import path from 'node:path';import {spawnSync} from 'node:child_process';
import '../web/engine.js';import '../web/lessons.js';
const jdk=process.argv[2]??process.env.JAVA_HOME;if(!jdk)throw new Error('Pass the JDK directory or set JAVA_HOME');
const exe=name=>path.join(jdk,'bin',name+(process.platform==='win32'?'.exe':''));
for(const m of JavaCourse.levels){const cwd=path.resolve('.sites-runtime/java/'+m.id),compile=spawnSync(exe('javac'),['-encoding','UTF-8','Mision.java'],{cwd,encoding:'utf8',timeout:20000});assert.equal(compile.status,0,m.id+' compile: '+compile.stderr);const run=spawnSync(exe('java'),['Mision'],{cwd,encoding:'utf8',timeout:10000});assert.equal(run.status,0,m.id+' run: '+run.stderr);const expected=RobotJava.execute(m.solution,m.initial).final;assert.equal(run.stdout.replace(/\r\n/g,'\n').trim(),expected.output.join('\n').trim(),m.id+' console differs');const atlas=expected.objects[0].robot;assert(run.stderr.includes(`Atlas: (${atlas.x}, ${atlas.y}), energia=${atlas.energy}, carga=${atlas.cargo}, entregas=${atlas.delivered}`),m.id+' Robot differs from Java');}
console.log('PASS: all 90 exported missions compile and run on the JDK; console and Atlas state match.');
