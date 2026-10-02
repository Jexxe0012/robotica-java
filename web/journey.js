'use strict';
// Visual presentation only. Mission rules, Java execution and saving remain in app.js.
(() => {
  const $ = id => document.getElementById(id);
  const {levels, chapters} = JavaCourse;
  const worlds = AtlasWorlds;
  const modes = {predict:'Leer y predecir', order:'Ordenar instrucciones', fix:'Encontrar y corregir', write:'Programar', project:'Proyecto'};
  let current, completed, choose, pause, badgeTimer, regionIndex = -1;
  const actors = new Map();
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function view(name, focus = false) {
    $('route').hidden = name !== 'map';
    $('mission-view').hidden = name !== 'mission';
    document.body.dataset.view = name;
    $('route-toggle').setAttribute('aria-expanded', String(name === 'map'));
    document.querySelector('.skip-link').href = name === 'map' ? '#journey-title' : '#mission-title';
    if (focus) $(name === 'map' ? 'journey-title' : 'mission-title').focus({preventScroll:true});
    window.scrollTo({top:0, behavior:'instant'});
  }
  function openMap() {
    pause();
    history.replaceState(null, '', '#map-' + (current.chapter + 1));
    view('map', true);
  }
  function chapter(index) {
    const missions = levels.filter(m => m.chapter === index);
    choose(missions.find(m => !completed.has(m.id)) ?? missions[0], false);
    $('chapters').querySelector(`[data-chapter="${index}"]`)?.focus({preventScroll:true});
  }
  function route(mission, finished) {
    current = mission;
    completed = finished;
    const region = worlds[current.chapter], points = region.points;
    if (regionIndex !== current.chapter) {
      regionIndex = current.chapter;
      document.body.dataset.region = region.id;
      document.body.style.setProperty('--region-image', `url("${region.image}")`);
      document.body.style.setProperty('--region-accent', region.accent);
      region.ground.forEach((color, i) => document.body.style.setProperty('--terrain-'+i, color));
      $('map-landscape').src = region.image;
      $('map-landscape').alt = region.alt;
      $('map-description').textContent = region.description;
    }
    $('chapters').replaceChildren();
    chapters.forEach((c, i) => {
      const missions = levels.filter(m => m.chapter === i);
      const button = el('button', undefined, 'chapter-button' + (i === current.chapter ? ' active' : ''));
      button.type = 'button';
      button.dataset.chapter = i;
      button.dataset.poo = String(i === 5 || i === 6);
      button.style.setProperty('--chapter-accent', worlds[i].accent);
      button.title = worlds[i].title;
      button.setAttribute('aria-pressed', String(i === current.chapter));
      button.setAttribute('aria-label', `Capítulo ${i+1}: ${c.title}, ${missions.filter(m => completed.has(m.id)).length} de 10 completadas`);
      const label = el('span', c.title, 'chapter-name');
      label.append(el('span', `${missions.filter(m => completed.has(m.id)).length} / 10`, 'chapter-count'));
      button.append(el('span', String(i+1).padStart(2,'0'), 'chapter-number'), label);
      button.addEventListener('click', () => chapter(i));
      $('chapters').append(button);
    });
    const missions = levels.filter(m => m.chapter === current.chapter);
    $('map-title').textContent = region.title;
    $('map-kicker').textContent = `CAPÍTULO ${String(current.chapter+1).padStart(2,'0')} · ${chapters[current.chapter].title.toUpperCase()}`;
    $('map-progress').textContent = `${missions.filter(m => completed.has(m.id)).length} de 10 misiones completadas`;
    $('map-stage').dataset.biome = current.chapter;
    $('map-path').replaceChildren();
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i-1], [x2, y2] = points[i];
      for (const cls of ['path-border', 'path-line' + (completed.has(missions[i-1].id) && completed.has(missions[i].id) ? ' done' : '')]) {
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
        path.setAttribute('class', cls);
        $('map-path').append(path);
      }
    }
    $('map-nodes').replaceChildren();
    missions.forEach((m, i) => {
      const done = completed.has(m.id), selected = current.id === m.id;
      const button = el('button', undefined, 'map-node' + (done ? ' completed' : '') + (selected ? ' selected' : '') + (m.mode === 'project' ? ' project' : ''));
      button.type = 'button';
      button.dataset.mission = m.id;
      button.dataset.labelAbove = String(points[i][1] >= 74);
      button.dataset.labelEdge = points[i][0] < 20 ? 'left' : points[i][0] > 80 ? 'right' : '';
      button.style.left = points[i][0] + '%';
      button.style.top = points[i][1] + '%';
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `Misión ${m.number}: ${m.title}${done ? ', completada' : ''}${m.mode === 'project' ? ', proyecto' : ''}`);
      button.append(el('span', done ? '✓' : m.mode === 'project' ? '✦' : String(m.number).padStart(2,'0')), el('span', m.title, 'node-label'));
      button.addEventListener('click', () => {
        choose(m, false);
        $('map-nodes').querySelector(`[data-mission="${m.id}"]`)?.focus({preventScroll:true});
      });
      $('map-nodes').append(button);
    });
    $('quest-kicker').textContent = `MISIÓN ${String(current.number).padStart(2,'0')} / 90`;
    $('quest-title').textContent = current.title;
    $('quest-mode').textContent = modes[current.mode];
    $('quest-description').textContent = current.description;
    $('quest-goal').textContent = current.goal;
    $('quest-completed').hidden = !completed.has(current.id);
    $('enter-mission').textContent = completed.has(current.id) ? 'Repetir misión' : 'Entrar a la misión';
    $('previous-chapter').disabled = current.chapter === 0;
    $('next-chapter').disabled = current.chapter === chapters.length-1;
    $('completed-total').textContent = `${completed.size} / 90`;
    $('course-progress').value = completed.size;
    $('progress-label').textContent = `${completed.size} misiones completadas`;
    $('world-heading').textContent = region.title;
  }
  function world(state, snap = false) {
    if (snap) {
      clearTimeout(badgeTimer);
      $('mission-badge').hidden = true;
      actors.clear();
      $('robot-layer').replaceChildren();
    }
    if (!$('world-grid').children.length) {
      for (let i = 0; i < 30; i++) {
        const cell = el('div', undefined, 'cell');
        cell.setAttribute('role','listitem');
        $('world-grid').append(cell);
      }
    }
    const robots = state.objects.filter(o => o.robot);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) {
      const occupants = robots.filter(o => o.robot.x === x && o.robot.y === y);
      const box = state.world.boxes.find(b => b[0] === x && b[1] === y && b[2] > 0);
      const wall = state.world.walls.some(w => w[0] === x && w[1] === y);
      const target = state.world.targets.some(t => t[0] === x && t[1] === y);
      const charger = state.world.chargers.some(c => c[0] === x && c[1] === y);
      const cell = $('world-grid').children[y*6+x];
      cell.className = 'cell' + (wall ? ' blocked' : '') + (target ? ' target' : '') + (charger ? ' charger' : '');
      const details = [`Casilla ${x}, ${y}`, wall?'obstáculo':'', target?'destino':'', charger?'recarga':'', box?`${box[2]} cajas`:'', ...occupants.map(o => `${o.robot.name}, mirando ${['este','sur','oeste','norte'][o.robot.dir]}`)].filter(Boolean).join('; ');
      cell.setAttribute('aria-label', details);
      cell.title = details;
      cell.replaceChildren(el('span', `${x},${y}`, 'cell-coordinate'));
      const symbol = wall ? '▥' : box ? '▣' : target ? '◎' : charger ? 'ϟ' : null;
      if (symbol) cell.append(el('span', symbol, 'world-item'));
      if (box) cell.append(el('span', '×'+box[2], 'cell-count'));
    }
    for (const [id, actor] of actors) if (!robots.some(o => o.id === id)) { actor.remove(); actors.delete(id); }
    for (const [index, object] of robots.entries()) {
      const robot = object.robot;
      let actor = actors.get(object.id);
      const overlap = robots.filter(o => o.robot.x === robot.x && o.robot.y === robot.y);
      const offset = overlap.length > 1 ? (overlap.findIndex(o => o.id === object.id) - (overlap.length-1)/2) * 5 : 0;
      if (!actor) {
        actor = el('div', undefined, 'robot-actor snap' + (index ? ' helper' : ''));
        actor.dataset.objectId = object.id;
        const image = el('img'); image.src = 'assets/atlas.png'; image.alt = ''; image.width = 144; image.height = 144;
        actor.append(image, el('span', '', 'robot-label'));
        $('robot-layer').append(actor); actors.set(object.id, actor);
        requestAnimationFrame(() => actor.classList.remove('snap'));
      }
      const left = ((robot.x+.5)/6*100 + offset) + '%', top = ((robot.y+.5)/5*100) + '%';
      const moved = actor.style.left && (actor.style.left !== left || actor.style.top !== top);
      actor.classList.toggle('moving', !!moved && !snap);
      actor.style.left = left; actor.style.top = top; actor.dataset.dir = robot.dir;
      actor.querySelector('.robot-label').textContent = `${robot.name} ${['→','↓','←','↑'][robot.dir]}`;
    }
    const atlas = robots.find(o => o.robot.name === 'Atlas')?.robot ?? robots[0]?.robot;
    $('hud-energy').textContent = atlas?.energy ?? '—';
    $('hud-cargo').textContent = atlas?.cargo ?? '—';
    $('hud-delivered').textContent = atlas?.delivered ?? '—';
  }
  function celebrate(success) {
    clearTimeout(badgeTimer);
    $('mission-badge').hidden = true;
    if (success) badgeTimer = setTimeout(() => {
      $('mission-badge').hidden = false;
      badgeTimer = setTimeout(() => { $('mission-badge').hidden = true; }, 1800);
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 380);
  }
  function init(onChoose, onPause) {
    choose = onChoose; pause = onPause;
    $('enter-mission').addEventListener('click', () => choose(current, true));
    $('route-toggle').addEventListener('click', openMap);
    $('feedback-map').addEventListener('click', openMap);
    $('brand-home').addEventListener('click', event => { event.preventDefault(); openMap(); });
    $('previous-chapter').addEventListener('click', () => chapter(current.chapter-1));
    $('next-chapter').addEventListener('click', () => chapter(current.chapter+1));
    $('show-coordinates').addEventListener('change', event => $('world').classList.toggle('coordinates', event.target.checked));
    window.addEventListener('keydown', event => { if (event.key === 'Escape' && document.body.dataset.view === 'mission') openMap(); });
    window.addEventListener('hashchange', () => {
      const mission = levels.find(m => '#'+m.id === location.hash);
      const chapterIndex = Number(location.hash.match(/^#map-(\d+)$/)?.[1])-1;
      if (mission) choose(mission, true);
      else if (chapterIndex >= 0 && chapterIndex < chapters.length) { chapter(chapterIndex); view('map'); }
    });
    view(/^#m\d{2}$/.test(location.hash) ? 'mission' : 'map');
  }
  globalThis.AtlasAdventure = {init, route, world, view, celebrate};
})();
