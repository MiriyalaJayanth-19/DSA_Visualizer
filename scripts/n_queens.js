(function () {
    const boardEl = document.getElementById('nqBoard');
    const logEl = document.getElementById('nqLog');

    const sizeInput = document.getElementById('nqSize');
    const speedInput = document.getElementById('nqSpeed');

    const startBtn = document.getElementById('nqStartBtn');
    const pauseBtn = document.getElementById('nqPauseBtn');
    const stepBtn = document.getElementById('nqStepBtn');
    const resetBtn = document.getElementById('nqResetBtn');

    if (!boardEl || !logEl || !sizeInput || !speedInput || !startBtn || !pauseBtn || !stepBtn || !resetBtn) return;

    let n = clampInt(parseInt(sizeInput.value), 4, 14);
    let speedMs = clampInt(parseInt(speedInput.value), 10, 2000);

    let timerId = null;
    let generator = null;
    let board = [];
    let fixed = false;

    function clampInt(v, min, max) {
        if (Number.isNaN(v)) return min;
        return Math.max(min, Math.min(max, v));
    }

    function logMessage(message, type = 'info') {
        const div = document.createElement('div');
        div.classList.add(`log-${type}`);
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEl.prepend(div);
        if (logEl.children.length > 80) {
            logEl.removeChild(logEl.lastChild);
        }
    }

    function clearLog() {
        logEl.innerHTML = '';
    }

    function buildBoardUI() {
        boardEl.innerHTML = '';
        boardEl.style.setProperty('--nq-n', String(n));

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'nq-cell';
                cell.dataset.r = String(r);
                cell.dataset.c = String(c);
                cell.classList.add(((r + c) % 2 === 0) ? 'is-light' : 'is-dark');
                boardEl.appendChild(cell);
            }
        }
    }

    function resetState({ keepLog = false } = {}) {
        stop();
        fixed = false;
        n = clampInt(parseInt(sizeInput.value), 4, 14);
        speedMs = clampInt(parseInt(speedInput.value), 10, 2000);

        board = new Array(n).fill(-1);
        generator = nQueensSteps(n);

        buildBoardUI();
        renderBoard();
        if (!keepLog) clearLog();
        logMessage(`Ready. N=${n}. Click Start or Step.`, 'info');
    }

    function stop() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    function start() {
        if (fixed) return;
        if (!generator) resetState({ keepLog: true });

        stop();
        speedMs = clampInt(parseInt(speedInput.value), 10, 2000);
        timerId = setInterval(() => {
            stepOnce();
        }, speedMs);
    }

    function pause() {
        stop();
    }

    function stepOnce() {
        if (fixed) return;
        if (!generator) resetState({ keepLog: true });

        const next = generator.next();
        if (next.done) {
            fixed = true;
            stop();
            logMessage('Finished: no more steps.', 'info');
            return;
        }

        applyStep(next.value);
    }

    function highlightLine(lineNum) {
        for (let i = 1; i <= 12; i++) {
            const el = document.getElementById(`nqLine${i}`);
            if (el) {
                el.style.backgroundColor = (i === lineNum) ? 'rgba(188, 140, 255, 0.3)' : 'transparent';
                el.style.display = 'block';
                if (i === lineNum) el.style.borderLeft = '3px solid var(--accent-purple)';
                else el.style.borderLeft = '3px solid transparent';
            }
        }
    }

    function applyStep(step) {
        if (step.line) highlightLine(step.line);

        switch (step.type) {
            case 'try': {
                highlightCell(step.row, step.col, 'is-trying');
                logMessage(`Try row ${step.row + 1}, col ${step.col + 1}`, 'info');
                break;
            }
            case 'conflict': {
                highlightCell(step.row, step.col, 'is-conflict');
                logMessage(`Conflict at row ${step.row + 1}, col ${step.col + 1}`, 'error');
                break;
            }
            case 'place': {
                board[step.row] = step.col;
                renderBoard({ focus: { row: step.row, col: step.col }, focusClass: 'is-placed' });
                logMessage(`Place queen at row ${step.row + 1}, col ${step.col + 1}`, 'hit');
                break;
            }
            case 'remove': {
                const col = board[step.row];
                board[step.row] = -1;
                renderBoard({ focus: { row: step.row, col: col }, focusClass: 'is-removed' });
                logMessage(`Backtrack: remove queen from row ${step.row + 1}`, 'evict');
                break;
            }
            case 'solution': {
                renderBoard();
                logMessage(`Solution found!`, 'hit');
                fixed = true;
                stop();
                break;
            }
            case 'call_solve':
            case 'return_true':
            case 'return_false':
                // just highlight line
                break;
            default:
                break;
        }
    }

    function cellAt(row, col) {
        return boardEl.querySelector(`.nq-cell[data-r="${row}"][data-c="${col}"]`);
    }

    function clearHighlights() {
        boardEl.querySelectorAll('.nq-cell.is-trying, .nq-cell.is-conflict, .nq-cell.is-placed, .nq-cell.is-removed')
            .forEach(el => el.classList.remove('is-trying', 'is-conflict', 'is-placed', 'is-removed'));
    }

    function highlightCell(row, col, cls) {
        clearHighlights();
        const el = cellAt(row, col);
        if (el) el.classList.add(cls);
    }

    function renderBoard({ focus = null, focusClass = null } = {}) {
        clearHighlights();

        boardEl.querySelectorAll('.nq-cell').forEach(cell => {
            cell.classList.remove('has-queen');
            cell.textContent = '';
        });

        for (let r = 0; r < n; r++) {
            const c = board[r];
            if (c >= 0) {
                const cell = cellAt(r, c);
                if (cell) {
                    cell.classList.add('has-queen');
                    cell.textContent = '♛';
                }
            }
        }

        if (focus && focusClass) {
            const el = cellAt(focus.row, focus.col);
            if (el) el.classList.add(focusClass);
        }
    }

    function isSafe(cols, row, col) {
        for (let r = 0; r < row; r++) {
            const c = cols[r];
            if (c === col) return false;
            const dr = row - r;
            if (Math.abs(col - c) === dr) return false;
        }
        return true;
    }

    function* nQueensSteps(size) {
        const cols = new Array(size).fill(-1);

        function* backtrack(row) {
            if (row === size) {
                yield { type: 'solution', line: 2 };
                return true;
            }

            for (let col = 0; col < size; col++) {
                yield { type: 'try', row, col, line: 3 };

                if (!isSafe(cols, row, col)) {
                    yield { type: 'conflict', row, col, line: 4 };
                    continue;
                }

                cols[row] = col;
                yield { type: 'place', row, col, line: 5 };

                yield { type: 'call_solve', row, line: 6 };
                const solved = yield* backtrack(row + 1);
                
                if (solved) {
                    yield { type: 'return_true', line: 7 };
                    return true;
                }

                yield { type: 'remove', row, line: 8 };
                cols[row] = -1;
            }
            yield { type: 'return_false', line: 11 };
            return false;
        }

        yield { type: 'call_solve', line: 1 };
        yield* backtrack(0);
    }

    sizeInput.addEventListener('change', () => {
        resetState();
    });

    speedInput.addEventListener('change', () => {
        speedMs = clampInt(parseInt(speedInput.value), 10, 2000);
        if (timerId !== null) {
            start();
        }
    });

    startBtn.addEventListener('click', () => {
        start();
    });

    pauseBtn.addEventListener('click', () => {
        pause();
    });

    stepBtn.addEventListener('click', () => {
        pause();
        stepOnce();
    });

    resetBtn.addEventListener('click', () => {
        resetState();
    });

    document.addEventListener('DOMContentLoaded', () => {
        resetState();
    });
})();
