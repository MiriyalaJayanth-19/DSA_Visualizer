/* ================================================================
   DSA Visualizer — Problem Registry
   To add a new problem:
   1. Add an entry to DSA_REGISTRY below
   2. Create the HTML section with id="section{id}"
   3. Create scripts/{id}.js with all logic
   ================================================================ */

const DSA_REGISTRY = [
    {
        id: 'lru',
        sectionId: 'sectionLru',
        title: 'LRU Cache',
        icon: '🗄️',
        category: 'Data Structure',
    },
    {
        id: 'bfs',
        sectionId: 'sectionBfs',
        title: 'Graph BFS/DFS',
        icon: '🕸️',
        category: 'Graph',
    },
    {
        id: 'nqueens',
        sectionId: 'sectionNQueens',
        title: 'N-Queens',
        icon: '♛',
        category: 'Backtracking',
    },
];

// ---------------------------------------------------------------
// Auto-generate nav tabs from the registry
// ---------------------------------------------------------------
(function buildNav() {
    const nav = document.getElementById('problemNav');
    if (!nav) return;

    DSA_REGISTRY.forEach((problem, index) => {
        const btn = document.createElement('button');
        btn.id = `tab${problem.id}`;
        btn.className = 'nav-tab' + (index === 0 ? ' is-active' : '');
        btn.type = 'button';
        btn.role = 'tab';
        btn.setAttribute('aria-selected', String(index === 0));
        btn.dataset.target = problem.sectionId;

        btn.innerHTML = `<span class="nav-tab-icon" aria-hidden="true">${problem.icon}</span>${problem.title}`;
        nav.appendChild(btn);
    });
})();

// ---------------------------------------------------------------
// Tab switching logic — driven by registry
// ---------------------------------------------------------------
(function initTabs() {
    const nav = document.getElementById('problemNav');
    if (!nav) return;

    function setActive(targetSectionId) {
        // Update tabs
        nav.querySelectorAll('.nav-tab').forEach(btn => {
            const isActive = btn.dataset.target === targetSectionId;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });

        // Update sections — remove then re-add to retrigger animation
        document.querySelectorAll('.algo-section').forEach(sec => {
            sec.classList.remove('is-active');
        });
        requestAnimationFrame(() => {
            const target = document.getElementById(targetSectionId);
            if (target) target.classList.add('is-active');
        });
    }

    nav.addEventListener('click', e => {
        const btn = e.target.closest('.nav-tab');
        if (btn && btn.dataset.target) setActive(btn.dataset.target);
    });
})();
