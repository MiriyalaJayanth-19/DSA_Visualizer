/* ================================================================
   Graph BFS Visualizer
   Visualizes Breadth-First Search on a predefined weighted graph.
   Nodes selectable; shows queue state, visited order, step log.
   ================================================================ */
(function () {
    // ---- Graph definition ----------------------------------------
    const GRAPH_NODES = [
        { id: 0, x: 260, y: 60, label: '0' },
        { id: 1, x: 100, y: 170, label: '1' },
        { id: 2, x: 420, y: 170, label: '2' },
        { id: 3, x: 40, y: 310, label: '3' },
        { id: 4, x: 190, y: 310, label: '4' },
        { id: 5, x: 340, y: 310, label: '5' },
        { id: 6, x: 480, y: 310, label: '6' },
        { id: 7, x: 120, y: 440, label: '7' },
        { id: 8, x: 310, y: 440, label: '8' },
        { id: 9, x: 200, y: 190, label: '9' },
    ];

    const GRAPH_EDGES = [
        [0, 1], [0, 2], [0, 9],
        [1, 3], [1, 4], [1, 9],
        [2, 5], [2, 6],
        [3, 7],
        [4, 7], [4, 8],
        [5, 8], [5, 6],
        [9, 4],
    ];

    // Build adjacency list
    const adj = {};
    GRAPH_NODES.forEach(n => adj[n.id] = []);
    GRAPH_EDGES.forEach(([a, b]) => {
        adj[a].push(b);
        adj[b].push(a);
    });

    // ---- State constants ------------------------------------------
    const STATE = { UNVISITED: 'unvisited', QUEUED: 'queued', CURRENT: 'current', VISITED: 'visited' };

    // ---- DOM refs ------------------------------------------------
    const svg = document.getElementById('bfsSvg');
    const logEl = document.getElementById('bfsLog');
    const queueEl = document.getElementById('bfsQueue');
    const visitedEl = document.getElementById('bfsVisited');
    const startBtn = document.getElementById('bfsStartBtn');
    const stepBtn = document.getElementById('bfsStepBtn');
    const resetBtn = document.getElementById('bfsResetBtn');
    const startNode = document.getElementById('bfsStartNode');
    const modeSelect = document.getElementById('bfsMode');

    if (!svg || !logEl) return;

    // ---- Runtime state -------------------------------------------
    let nodeStates = {};
    let queue = [];
    let visited = [];
    let stepGen = null;
    let timerId = null;
    let running = false;

    // ---- Logging -------------------------------------------------
    function log(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-${type}`;
        div.textContent = `[Step ${visited.length}] ${msg}`;
        logEl.prepend(div);
        if (logEl.children.length > 80) logEl.removeChild(logEl.lastChild);
    }

    function updateInfoPanels() {
        queueEl.innerHTML = '';
        if (queue.length === 0) {
            queueEl.innerHTML = '<span class="bfs-empty-info">empty</span>';
        } else {
            queue.forEach((nid, i) => {
                const span = document.createElement('span');
                span.className = 'bfs-queue-chip' + (i === 0 ? ' bfs-queue-front' : '');
                span.textContent = nid;
                queueEl.appendChild(span);
            });
        }
        visitedEl.innerHTML = visited.map(nid =>
            `<span class="bfs-visited-chip">${nid}</span>`).join('') || '<span class="bfs-empty-info">none yet</span>';
    }

    // ---- SVG rendering -------------------------------------------
    function renderSvg() {
        svg.innerHTML = '';

        const SVGNS = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(SVGNS, 'defs');

        // Arrow marker
        const marker = document.createElementNS(SVGNS, 'marker');
        marker.setAttribute('id', 'arr');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('refX', '5');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        const mpoly = document.createElementNS(SVGNS, 'polygon');
        mpoly.setAttribute('points', '0 0, 6 3, 0 6');
        mpoly.setAttribute('fill', 'var(--border-medium)');
        marker.appendChild(mpoly);
        defs.appendChild(marker);
        svg.appendChild(defs);

        // Edges
        GRAPH_EDGES.forEach(([a, b]) => {
            const na = GRAPH_NODES[a], nb = GRAPH_NODES[b];
            const line = document.createElementNS(SVGNS, 'line');
            line.setAttribute('x1', na.x); line.setAttribute('y1', na.y);
            line.setAttribute('x2', nb.x); line.setAttribute('y2', nb.y);
            line.setAttribute('stroke', 'var(--border-medium)');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('class', 'bfs-edge');

            // Highlight edge if both nodes visited or one is current
            const stA = nodeStates[a], stB = nodeStates[b];
            const activeEdge = (stA === STATE.VISITED || stA === STATE.CURRENT) &&
                (stB === STATE.VISITED || stB === STATE.CURRENT);
            if (activeEdge) {
                line.setAttribute('stroke', 'var(--accent-green)');
                line.setAttribute('stroke-width', '2.5');
                line.setAttribute('opacity', '0.7');
            }
            svg.insertBefore(line, svg.firstChild);
        });

        // Nodes
        GRAPH_NODES.forEach(node => {
            const g = document.createElementNS(SVGNS, 'g');
            g.setAttribute('class', 'bfs-node-group');
            g.setAttribute('data-id', node.id);
            g.setAttribute('tabindex', '0');
            g.setAttribute('aria-label', `Node ${node.label}`);
            g.style.cursor = 'pointer';

            const state = nodeStates[node.id] || STATE.UNVISITED;

            // Outer ring (shows state colour)
            const ring = document.createElementNS(SVGNS, 'circle');
            ring.setAttribute('cx', node.x); ring.setAttribute('cy', node.y);
            ring.setAttribute('r', '24');
            ring.setAttribute('class', `bfs-ring bfs-ring-${state}`);
            ring.setAttribute('fill', 'none');
            ring.setAttribute('stroke-width', '3');

            // Node circle
            const circle = document.createElementNS(SVGNS, 'circle');
            circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y);
            circle.setAttribute('r', '18');
            circle.setAttribute('class', `bfs-node bfs-node-${state}`);

            // Label
            const text = document.createElementNS(SVGNS, 'text');
            text.setAttribute('x', node.x); text.setAttribute('y', node.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'bfs-label');
            text.textContent = node.label;

            g.appendChild(ring);
            g.appendChild(circle);
            g.appendChild(text);
            svg.appendChild(g);

            // Click to set start node
            g.addEventListener('click', () => {
                if (!running) {
                    startNode.value = node.id;
                    highlightStartNodePreview(node.id);
                }
            });
        });

        updateInfoPanels();
    }

    function highlightStartNodePreview(id) {
        svg.querySelectorAll('.bfs-node-group').forEach(g => {
            g.classList.toggle('bfs-start-preview', Number(g.dataset.id) === id);
        });
    }

    // ---- BFS / DFS Generator ------------------------------------
    function* bfsGenerator(startId, mode) {
        queue = [startId];
        visited = [];
        nodeStates = {};
        GRAPH_NODES.forEach(n => nodeStates[n.id] = STATE.UNVISITED);
        nodeStates[startId] = STATE.QUEUED;
        renderSvg();
        log(`Start: node ${startId} enqueued.`, 'info');
        yield;

        while (queue.length > 0) {
            const curr = mode === 'bfs' ? queue.shift() : queue.pop();
            nodeStates[curr] = STATE.CURRENT;
            renderSvg();
            log(`Dequeue node ${curr} → processing.`, 'info');
            yield;

            nodeStates[curr] = STATE.VISITED;
            visited.push(curr);
            renderSvg();
            log(`Visited node ${curr}.`, 'hit');
            yield;

            // Sort neighbours for deterministic order
            const neighbours = [...adj[curr]].sort((a, b) => a - b);
            for (const nb of neighbours) {
                if (nodeStates[nb] === STATE.UNVISITED) {
                    nodeStates[nb] = STATE.QUEUED;
                    queue.push(nb);
                    renderSvg();
                    log(`Enqueue node ${nb} (neighbour of ${curr}).`, 'info');
                    yield;
                }
            }
        }

        log(`${mode.toUpperCase()} complete! Visited order: [${visited.join(' → ')}]`, 'hit');
        renderSvg();
    }

    // ---- Controls -----------------------------------------------
    function resetAll() {
        stop();
        nodeStates = {};
        GRAPH_NODES.forEach(n => nodeStates[n.id] = STATE.UNVISITED);
        queue = [];
        visited = [];
        stepGen = null;
        running = false;
        logEl.innerHTML = '';
        renderSvg();
    }

    function stop() {
        if (timerId) { clearInterval(timerId); timerId = null; }
        running = false;
    }

    function initGen() {
        const sid = parseInt(startNode.value);
        const mode = modeSelect ? modeSelect.value : 'bfs';
        if (isNaN(sid) || sid < 0 || sid >= GRAPH_NODES.length) {
            log('Invalid start node.', 'error');
            return false;
        }
        resetAll();
        stepGen = bfsGenerator(sid, mode);
        return true;
    }

    startBtn.addEventListener('click', () => {
        if (!stepGen && !initGen()) return;
        if (running) { stop(); return; }
        running = true;
        const speed = 600;
        timerId = setInterval(() => {
            const res = stepGen.next();
            if (res.done) { stop(); }
        }, speed);
    });

    stepBtn.addEventListener('click', () => {
        stop();
        if (!stepGen && !initGen()) return;
        const res = stepGen.next();
        if (res.done) stepGen = null;
    });

    resetBtn.addEventListener('click', resetAll);

    // ---- Init ---------------------------------------------------
    resetAll();
})();
