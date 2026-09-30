'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const lessons = window.HUERTO_LESSONS;
  let index = 0, prediction = null, cursor = 0, trace = [], running = false, timer = null;
  const complete = new Set();
  let state;
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function initialState(id) {
    const cells = Array.from({length: 5}, () => ({plant: false, watered: false, weeds: 0}));
    if (id === 'condition') cells[0].plant = true;
    if (id === 'while') cells[0].weeds = 3;
    return {position: 0, cells, vars: id === 'while' ? {hierbas: 3} : {}};
  }
  function highlighted(line) {
    return escape(line).replace(/\b(int|if|else|for|while|static|void|class)\b/g, '<span class="tok-keyword">$1</span>').replace(/\b(\d+)\b/g, '<span class="tok-number">$1</span>').replace(/\b(plantar|regar|avanzar|hayHierba|quitarHierba|preparar|jugar)(?=\()/g, '<span class="tok-method">$1</span>');
  }
  function buildTrace(lesson) {
    const steps = [];
    const add = (line, message, effect = () => {}) => steps.push({line, message, effect});
    const plant = () => {state.cells[state.position].plant = true;};
    const water = () => {if (state.cells[state.position].plant) state.cells[state.position].watered = true;};
    const move = amount => {state.position += amount;};
    if (lesson.id === 'sequence') {
      add(0, 'Plantas en la casilla 1. El personaje permanece allí.', plant);
      add(1, 'Avanzas 1 casilla: ahora estás en la 2.', () => move(1));
      add(2, 'Plantas en la casilla 2.', plant);
      add(3, 'Riegas la casilla actual: la 2. El primer cultivo sigue sin regar.', water);
    }
    if (lesson.id === 'variables') {
      add(0, 'Creas pasos y guardas el entero 1.', () => {state.vars.pasos = 1;});
      add(1, 'Lees pasos (1), calculas 1 + 1 y guardas 2. Reemplazas el valor anterior.', () => {state.vars.pasos = state.vars.pasos + 1;});
      add(2, 'pasos vale 2: avanzas dos casillas, de la 1 a la 3.', () => move(state.vars.pasos));
    }
    if (lesson.id === 'condition') {
      add(0, 'La variable humedad empieza con el valor 30.', () => {state.vars.humedad = 30;});
      add(2, 'Comparas 30 < 40: da true. Entras en la rama del if.', () => {state.vars['humedad < 40'] = true;});
      add(3, 'Riegas el cultivo de la casilla 1. El personaje no se mueve.', water);
      add(6, 'Omites el bloque else. Termina la decisión; avanzar() no se ejecutó.');
    }
    if (lesson.id === 'for') {
      add(0, 'Inicializas i = 0. Compruebas 0 < 3: true. Empieza la primera vuelta.', () => {state.vars.i = 0;state.vars['i < 3'] = true;});
      for (let i = 0; i < 3; i++) {
        const iteration = i;
        add(1, `Con i = ${i}, plantas en la casilla ${i + 1}.`, plant);
        add(2, `Avanzas a la casilla ${i + 2}. Termina el cuerpo de esta vuelta.`, () => move(1));
        add(0, i === 2 ? 'Aumentas i a 3. 3 < 3 da false: termina el bucle. i sale de alcance; mostramos su último valor observado.' : `Aumentas i a ${i + 1}. ${i + 1} < 3 da true: comienza otra vuelta.`, () => {state.vars.i = iteration + 1;state.vars['i < 3'] = iteration + 1 < 3;if (iteration === 2) {state.vars['último i'] = state.vars.i;delete state.vars.i;}});
      }
    }
    if (lesson.id === 'while') {
      for (let remaining = 3; remaining > 0; remaining--) {
        add(0, `Quedan ${remaining} hierbas: hayHierba() da true. Entras al cuerpo.`, () => {state.vars['hayHierba()'] = true;});
        add(1, `Quitas una hierba. Ahora quedan ${remaining - 1}.`, () => {state.cells[0].weeds--;state.vars.hierbas = state.cells[0].weeds;});
      }
      add(0, 'Ya no queda hierba: hayHierba() da false. Termina el bucle sin otra acción.', () => {state.vars['hayHierba()'] = false;});
    }
    if (lesson.id === 'method') {
      add(7, 'jugar() llama a preparar(granja). Entras al método con el personaje en la casilla 1.', () => {state.vars['método actual'] = 'preparar';state.vars.llamadas = 1;});
      add(2, 'Dentro de preparar(): plantas en la casilla 1.', plant);
      add(3, 'Dentro de preparar(): riegas el cultivo de la casilla 1.', water);
      add(4, 'preparar() termina. Vuelves a jugar(), justo después de la llamada.', () => {state.vars['método actual'] = 'jugar';});
      add(8, 'jugar() avanza el personaje a la casilla 2.', () => move(1));
      add(9, 'Llamas otra vez a preparar(granja), ahora desde la casilla 2.', () => {state.vars['método actual'] = 'preparar';state.vars.llamadas = 2;});
      add(2, 'Dentro de preparar(): plantas en la casilla 2.', plant);
      add(3, 'Dentro de preparar(): riegas el cultivo de la casilla 2.', water);
      add(4, 'Termina la segunda llamada. Vuelves a jugar().', () => {state.vars['método actual'] = 'jugar';});
      add(10, 'jugar() termina: hay dos cultivos regados. La definición se reutilizó dos veces.', () => {state.vars['método actual'] = 'terminado';});
    }
    return steps;
  }
  function renderFarm() {
    $('farm-grid').innerHTML = state.cells.map((cell, i) => {
      const label = `Casilla ${i + 1}: ${cell.weeds ? cell.weeds + ' hierbas' : cell.plant ? 'cultivo ' + (cell.watered ? 'regado' : 'sin regar') : 'vacía'}${state.position === i ? '. Personaje aquí' : ''}`;
      return `<div role="listitem" class="tile ${cell.watered ? 'watered' : ''} ${state.position === i ? 'current' : ''}" aria-label="${label}">${state.position === i ? '<span class="tile-robot" aria-hidden="true">🤖</span>' : ''}<span class="tile-crop" aria-hidden="true">${cell.weeds ? '🌿' : cell.plant ? '🌱' : ''}</span>${cell.weeds ? `<span class="weed-count" aria-hidden="true">×${cell.weeds}</span>` : ''}<span class="tile-number" aria-hidden="true">${i + 1}</span>${cell.watered ? '<span class="tile-water" aria-hidden="true">💧</span>' : ''}</div>`;
    }).join('');
    const values = {casilla: state.position + 1, ...state.vars};
    $('variables').innerHTML = Object.entries(values).map(([key, value]) => `<span class="variable">${escape(key)} = <strong>${escape(value)}</strong></span>`).join('');
  }
  function renderNav() {
    $('progress-text').textContent = `${complete.size} de ${lessons.length} misiones`;
    $('mission-nav').innerHTML = lessons.map((lesson, i) => `<button class="mission-button ${i === index ? 'active' : ''} ${complete.has(i) ? 'completed' : ''}" data-mission="${i}" ${i === index ? 'aria-current="step"' : ''} aria-label="Misión ${i + 1}, ${lesson.name}${complete.has(i) ? ', completada' : ''}"><span class="mission-number">${complete.has(i) ? '✓' : i + 1}</span>${lesson.name}</button>`).join('');
    $('mission-nav').querySelectorAll('button').forEach(button => button.addEventListener('click', () => loadLesson(Number(button.dataset.mission))));
  }
  function loadLesson(next, focusTitle = true) {
    clearTimeout(timer);running = false;index = next;prediction = null;cursor = 0;
    const lesson = lessons[index];state = initialState(lesson.id);trace = buildTrace(lesson);
    renderNav();$('chapter').textContent = `MISIÓN ${index + 1} / ${lessons.length}`;
    $('mission-title').textContent = lesson.title;$('mission-intro').textContent = lesson.intro;$('concept').textContent = lesson.concept;
    $('farm-initial').textContent = `Al empezar: ${lesson.initial}`;$('farm-status').textContent = 'Estado inicial';
    $('code-lines').innerHTML = lesson.code.map((line, i) => `<div class="code-line" data-line="${i}"><span class="line-number" aria-hidden="true">${i + 1}</span><code>${highlighted(line)}</code></div>`).join('');
    document.querySelector('.code-caption').innerHTML = (lesson.id === 'method' ? 'El juego llama una vez a <code>Juego.jugar(granja)</code>.' : 'Estas líneas están dentro de <code>jugar(Granja granja)</code>.') + '<br>API de granja ficticia · Simulación educativa';
    $('reference-content').innerHTML = '<dl>' + lesson.reference.map(([name, description]) => `<dt><code>${escape(name)}</code></dt><dd>${escape(description)}</dd>`).join('') + '</dl><p style="margin-top:12px">El juego ya creó la granja. Sus métodos son una API ficticia: el navegador simula estos ejemplos y no compila Java.</p>';
    $('question').textContent = lesson.question;
    $('answers').innerHTML = '<legend class="sr-only">Elige tu predicción</legend>' + lesson.answers.map((answer, i) => `<label class="answer"><input type="radio" name="prediction" value="${i}"><span>${escape(answer)}</span></label>`).join('');
    $('answers').querySelectorAll('input').forEach(input => input.addEventListener('change', () => {prediction = Number(input.value);updateControls();$('action-help').textContent = 'Predicción lista. Observa si el código hace lo que imaginaste.';}));
    $('feedback').hidden = true;$('bonus').hidden = true;
    $('trace-text').textContent = 'Primero haz tu predicción. Después seguimos el código juntos.';$('step-count').textContent = '';
    $('action-help').textContent = 'No pasa nada si te equivocas: aquí venimos a entender.';
    renderFarm();updateControls();if (focusTitle) $('mission-title').focus({preventScroll:true});
  }
  function updateControls() {
    $('step-button').disabled = prediction === null || running || cursor >= trace.length;
    $('run-button').disabled = prediction === null || running || cursor >= trace.length;
    $('answers').querySelectorAll('input').forEach(input => {input.disabled = cursor > 0 || running;});
  }
  function takeStep() {
    if (prediction === null || cursor >= trace.length) return;
    const step = trace[cursor++];step.effect();
    document.querySelectorAll('.code-line').forEach(line => line.classList.toggle('active', Number(line.dataset.line) === step.line));
    $('trace-text').textContent = step.message;$('step-count').textContent = `${cursor}/${trace.length}`;
    $('farm-status').textContent = cursor === trace.length ? 'Resultado final' : 'En ejecución';
    renderFarm();if (cursor === trace.length) {running = false;finish();}updateControls();
  }
  function runAll() {
    if (running || prediction === null || cursor >= trace.length) return;
    running = true;updateControls();
    const tick = () => {if (!running) return;takeStep();if (running) timer = setTimeout(tick, matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : 550);};tick();
  }
  function finish() {
    const lesson = lessons[index], correct = prediction === lesson.correct;
    if (correct) {complete.add(index);renderNav();}
    const errorIndex = prediction < lesson.correct ? prediction : prediction - 1;
    $('feedback').className = `feedback${correct ? '' : ' incorrect'}`;
    $('feedback').innerHTML = `<h2>${correct ? '✓ Bien pensado. Ya viste por qué.' : 'La granja nos da una pista.'}</h2><p>${escape(correct ? lesson.explanation : lesson.errors[errorIndex])}</p>${correct ? '' : `<p style="margin-top:8px">${escape(lesson.hint)}</p>`}<div class="feedback-actions"><button id="retry" class="button secondary">${correct ? 'Repetir misión' : 'Volver a intentarlo'}</button>${correct && index < lessons.length - 1 ? '<button id="next" class="button primary">Siguiente misión</button>' : ''}</div>`;
    $('feedback').hidden = false;const feedbackHeading = $('feedback').querySelector('h2');feedbackHeading.tabIndex = -1;feedbackHeading.focus({preventScroll:true});$('retry').addEventListener('click', () => loadLesson(index));
    if ($('next')) $('next').addEventListener('click', () => {loadLesson(index + 1);$('mission-title').scrollIntoView({block:'start',behavior:'smooth'});});
    $('action-help').textContent = correct ? 'Ahora puedes explicar qué pasó, instrucción por instrucción.' : 'Equivocarse sirve: compara tu idea con el estado final.';
    if (correct && lesson.bonus) renderBonus(lesson.bonus);
    if (correct && complete.size === lessons.length && lessons.length > 1) {
      const note = document.createElement('p');note.style.marginTop = '12px';note.textContent = '🌱 Completaste las seis misiones. Vuelve a una de ellas e intenta explicar cada paso en voz alta antes de ejecutarlo.';$('feedback').append(note);
    }
  }
  function renderBonus(type) {
    $('bonus').hidden = false;
    if (type === 'sequence') {
      $('bonus').innerHTML = '<h2>Ahora añade una instrucción</h2><p>Queremos regar los dos cultivos. ¿Qué pondrías en el espacio?</p><div class="bonus-code">granja.plantar();<br><select id="bonus-choice" aria-label="Instrucción que falta"><option value="">Elige una instrucción</option><option value="move">granja.avanzar(1);</option><option value="plant">granja.plantar();</option><option value="water">granja.regar();</option></select><br>granja.avanzar(1);<br>granja.plantar();<br>granja.regar();</div><div class="bonus-controls"><button id="bonus-check" class="button secondary">Probar mi cambio</button><p id="bonus-result" aria-live="polite"></p></div>';
      $('bonus-check').addEventListener('click', () => {
        const choice = $('bonus-choice').value;
        if (!choice) {$('bonus-result').textContent = 'Elige la instrucción que quieres probar.';return;}
        state = initialState('sequence');state.cells[0].plant = true;
        if (choice === 'water') state.cells[0].watered = true;
        if (choice === 'move') state.position++;
        state.position++;state.cells[state.position].plant = true;state.cells[state.position].watered = true;
        renderFarm();$('farm-status').textContent = 'Tu cambio';clearTraceHighlight();
        $('bonus-result').textContent = choice === 'water' ? '✓ Ahora ambas casillas están regadas. Regar antes de avanzar cambia el resultado.' : choice === 'move' ? 'Avanzaste dos veces: terminas regando la casilla 3. El cultivo de la 1 sigue seco.' : 'Plantar de nuevo no riega. El cultivo de la casilla 1 sigue seco.';
        $('trace-text').textContent = 'Probaste tu instrucción. Compara el huerto con el resultado anterior.';
      });
    }
    if (type === 'while') {
      $('bonus').innerHTML = '<h2>Evita que el bucle se quede atrapado</h2><p>Elige la acción que hace que hayHierba() llegue a ser false.</p><div class="bonus-code">while (granja.hayHierba()) {<br>    <select id="bonus-choice" aria-label="Acción dentro del bucle"><option value="">Elige una instrucción</option><option value="water">granja.regar();</option><option value="remove">granja.quitarHierba();</option><option value="plant">granja.plantar();</option></select><br>}</div><div class="bonus-controls"><button id="bonus-check" class="button secondary">Probar mi cambio</button><p id="bonus-result" aria-live="polite"></p></div>';
      $('bonus-check').addEventListener('click', () => {
        const choice = $('bonus-choice').value;
        if (!choice) {$('bonus-result').textContent = 'Elige qué acción repetir.';return;}
        state = initialState('while');
        if (choice === 'remove') {state.cells[0].weeds = 0;state.vars.hierbas = 0;state.vars['hayHierba()'] = false;}
        else {if (choice === 'plant') state.cells[0].plant = true;state.vars['hayHierba()'] = true;}
        renderFarm();clearTraceHighlight();$('farm-status').textContent = choice === 'remove' ? 'Tu cambio' : 'Bucle detenido';
        $('bonus-result').textContent = choice === 'remove' ? '✓ Quitar una hierba por vuelta cambia el estado. Tras tres acciones la condición es false y termina.' : 'La hierba no disminuye. La condición seguirá siendo true y el bucle no terminará. El juego lo detuvo para que puedas corregirlo.';
        $('trace-text').textContent = choice === 'remove' ? 'La condición llegó a false después de quitar las tres hierbas.' : 'Probaste una vuelta: siguen las mismas tres hierbas. Repetir esta acción no acerca el bucle a su final.';
      });
    }
  }
  function clearTraceHighlight() {document.querySelectorAll('.code-line').forEach(line => line.classList.remove('active'));$('step-count').textContent = '';}
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    const readProgress = () => ({mission: index + 1, topic: lessons[index].name, completed: [...complete].map(i => i + 1), step: cursor, totalSteps: trace.length, position: state.position + 1});
    const registrations = [
      {name:'read_learning_progress',title:'Ver progreso de Java',description:'Lee la misión, el paso y el progreso actual del minijuego.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('Usa un objeto vacío.');return readProgress();}},
      {name:'start_java_mission',title:'Abrir una misión de Java',description:'Abre una misión del 1 al 6. Reinicia la predicción y el huerto de esa misión.',inputSchema:{type:'object',properties:{mission:{type:'integer',minimum:1,maximum:6}},required:['mission'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if (!input || !Number.isInteger(input.mission) || input.mission < 1 || input.mission > lessons.length || Object.keys(input).some(key => key !== 'mission')) throw new Error('La misión debe ser un entero del 1 al 6.');loadLesson(input.mission - 1);return readProgress();}}
    ];
    for (const tool of registrations) {try {Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(() => {});} catch {}}
    window.addEventListener('pagehide',() => lifecycle.abort(),{once:true});
  }
  $('step-button').addEventListener('click', takeStep);$('run-button').addEventListener('click', runAll);
  loadLesson(0, false);
})();
