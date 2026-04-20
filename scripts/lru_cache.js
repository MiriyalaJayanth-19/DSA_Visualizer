class Node {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

class LRUCache {
    constructor(capacity) {
        if (capacity <= 0) {
            throw new Error("Capacity must be a positive integer.");
        }
        this.capacity = capacity;
        this.cache = {}; // Map key -> Node
        this.size = 0;

        // Initialize dummy head and tail nodes
        this.head = new Node(null, null);
        this.tail = new Node(null, null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    _removeNode(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        node.prev = null; // Clean up references
        node.next = null; // Clean up references
    }

    _addToHead(node) {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next.prev = node;
        this.head.next = node;
    }

    get(key) {
        if (this.cache[key]) {
            const node = this.cache[key];
            this._removeNode(node);
            this._addToHead(node);
            return { value: node.value, hit: true };
        }
        return { value: -1, hit: false };
    }

    put(key, value) {
        let evictedKey = null;
        let isUpdate = false;

        if (this.cache[key]) {
            // Update existing node
            const node = this.cache[key];
            node.value = value;
            this._removeNode(node);
            this._addToHead(node);
            isUpdate = true;
        } else {
            // Add new node
            if (this.size === this.capacity) {
                // Cache is full, evict LRU
                const lruNode = this.tail.prev;
                evictedKey = lruNode.key;
                this._removeNode(lruNode);
                delete this.cache[lruNode.key];
                this.size--; // Decrement size after eviction
            }
            const newNode = new Node(key, value);
            this._addToHead(newNode);
            this.cache[key] = newNode;
            this.size++;
        }
        return { evictedKey: evictedKey, isUpdate: isUpdate };
    }

    getCurrentState() {
        const state = [];
        let current = this.head.next;
        while (current !== this.tail) {
            state.push({ key: current.key, value: current.value });
            current = current.next;
        }
        return state;
    }

    reset() {
        this.cache = {};
        this.size = 0;
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
}

// --- DOM Elements ---
const capacityInput = document.getElementById('capacity');
const setCapacityBtn = document.getElementById('setCapacityBtn');
const keyInput = document.getElementById('keyInput');
const valueInput = document.getElementById('valueInput');
const getBtn = document.getElementById('getBtn');
const putBtn = document.getElementById('putBtn');
const resetBtn = document.getElementById('resetBtn');
const cacheDisplay = document.getElementById('cacheDisplay');
const logOutput = document.getElementById('log');
const hiwPanel = document.getElementById('hiwPanel');
const cacheEmptyPlaceholder = document.getElementById('cacheEmptyPlaceholder');

let lruCache = new LRUCache(parseInt(capacityInput.value));

// --- Logging Function ---
function logMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.classList.add(`log-${type}`);
    div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logOutput.prepend(div); // Add to top
    if (logOutput.children.length > 50) { // Keep log concise
        logOutput.removeChild(logOutput.lastChild);
    }
}

// --- Visualization Function ---
function updateVisualization({ highlightKey = null, type = null, evictedKey = null } = {}) {
    const currentState = lruCache.getCurrentState();
    cacheDisplay.innerHTML = ''; // Clear existing nodes

    if (currentState.length === 0) {
        // Show empty placeholder inside cache-display and the how-it-works guide below
        if (cacheEmptyPlaceholder) cacheEmptyPlaceholder.style.display = 'flex';
        if (hiwPanel) {
            hiwPanel.style.display = 'flex';
            // Re-trigger entrance animation
            hiwPanel.style.animation = 'none';
            hiwPanel.offsetHeight; // force reflow
            hiwPanel.style.animation = '';
        }
        return;
    }

    // Update Hash Map Display
    const hashMapContent = document.getElementById('hashMapContent');
    if (hashMapContent) {
        if (currentState.length === 0) {
            hashMapContent.innerHTML = `<span style="color: var(--text-muted)">Empty</span>`;
        } else {
            hashMapContent.innerHTML = Object.keys(lruCache.cache).map(k => `
                <div style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                    <span style="color: var(--accent-purple);">${k}</span> <span style="color: var(--text-muted);">→</span> <span style="color: var(--accent-blue);">Node(&amp;${k})</span>
                </div>
            `).join('');
        }
    }

    // Cache has items — hide guide + placeholder
    if (cacheEmptyPlaceholder) cacheEmptyPlaceholder.style.display = 'none';
    if (hiwPanel) hiwPanel.style.display = 'none';


    // Temporarily disable flex gap if we're doing a complex animation
    // to control absolute positioning more easily. Re-enable after animation.
    cacheDisplay.style.gap = '0px';
    cacheDisplay.style.justifyContent = 'flex-start';

    // Store the initial positions of existing nodes before rendering
    const existingNodeElements = {};
    document.querySelectorAll('.cache-node').forEach(nodeEl => {
        existingNodeElements[nodeEl.dataset.key] = nodeEl.getBoundingClientRect();
    });

    const nodeElements = []; // Store elements for measuring/animating

    currentState.forEach((item, index) => {
        const nodeDiv = document.createElement('div');
        nodeDiv.classList.add('cache-node');
        nodeDiv.dataset.key = item.key;
        nodeDiv.dataset.value = item.value;
        nodeDiv.style.order = index; // Use CSS order for logical position

        // Add highlight classes
        if (highlightKey === item.key) {
            if (type === 'hit') {
                nodeDiv.classList.add('highlight-hit');
            } else if (type === 'new' || type === 'update') {
                nodeDiv.classList.add('highlight-new');
            }
        } else if (evictedKey === item.key && type === 'evict') {
            // This case might not happen if evicted item is fully removed before redraw
            // but can be used for fading out or specific effects.
        }


        nodeDiv.innerHTML = `
            <span class="node-label">Key</span>
            <span class="key">${item.key}</span>
            <span class="node-label">Value</span>
            <span class="value">${item.value}</span>
        `;
        cacheDisplay.appendChild(nodeDiv);
        nodeElements.push(nodeDiv);

        if (index < currentState.length - 1) {
            const arrowDiv = document.createElement('div');
            arrowDiv.innerHTML = '⟷';
            arrowDiv.style.order = index; // Keep order logical
            arrowDiv.style.color = 'var(--text-muted)';
            arrowDiv.style.fontSize = '1.5rem';
            arrowDiv.style.display = 'flex';
            arrowDiv.style.alignItems = 'center';
            arrowDiv.classList.add('cache-arrow');
            cacheDisplay.appendChild(arrowDiv);
        }
    });

    // Handle eviction animation for the item that was removed
    if (evictedKey !== null && type === 'evict' && existingNodeElements[evictedKey]) {
        const evictedNodeEl = document.createElement('div'); // Create a temporary element
        evictedNodeEl.classList.add('cache-node', 'highlight-evicted');
        evictedNodeEl.innerHTML = `
            <span class="node-label">Key</span>
            <span class="key">${evictedKey}</span>
            <span class="node-label">Evicted</span>
        `;
        // Position it where it originally was before removal
        const rect = existingNodeElements[evictedKey];
        evictedNodeEl.style.position = 'absolute';
        evictedNodeEl.style.left = `${rect.left - cacheDisplay.getBoundingClientRect().left}px`;
        evictedNodeEl.style.top = `${rect.top - cacheDisplay.getBoundingClientRect().top}px`;
        cacheDisplay.appendChild(evictedNodeEl);

        setTimeout(() => {
            evictedNodeEl.remove();
            // After eviction animation, animate other nodes if they moved
            animateNodePositions(nodeElements, existingNodeElements);
        }, 700); // Wait for eviction animation to play
    } else {
        // No eviction, or eviction handled by separate logic, just animate existing nodes
        animateNodePositions(nodeElements, existingNodeElements);
    }

    // Reset positioning after potential animations finish
    setTimeout(() => {
        cacheDisplay.style.gap = '12px';
        cacheDisplay.style.justifyContent = 'flex-start';
    }, 850);

}


function animateNodePositions(newNodeElements, oldRects) {
    const displayRect = cacheDisplay.getBoundingClientRect();

    newNodeElements.forEach(newNodeEl => {
        const key = newNodeEl.dataset.key;
        if (oldRects[key]) {
            // This node existed before, calculate its old and new positions
            const oldRect = oldRects[key];
            const newRect = newNodeEl.getBoundingClientRect();

            // Calculate the delta for transformation
            const deltaX = oldRect.left - newRect.left;
            const deltaY = oldRect.top - newRect.top;

            // Apply the inverse translation to move it to its old position
            newNodeEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            newNodeEl.style.transition = 'transform 0s'; // No transition for initial move

            // Force reflow
            newNodeEl.offsetWidth;

            // Then transition it back to its new position
            newNodeEl.style.transition = 'transform 0.4s ease-in-out';
            newNodeEl.style.transform = ''; // Animate back to original position
        }
    });
}


// --- Event Listeners ---
setCapacityBtn.addEventListener('click', () => {
    const newCapacity = parseInt(capacityInput.value);
    if (isNaN(newCapacity) || newCapacity <= 0) {
        logMessage('Invalid capacity. Please enter a positive number.', 'error');
        return;
    }
    lruCache = new LRUCache(newCapacity);
    logMessage(`Cache capacity set to ${newCapacity}. Cache reset.`, 'info');
    updateVisualization();
});

getBtn.addEventListener('click', () => {
    const key = parseInt(keyInput.value);
    if (isNaN(key)) {
        logMessage('Please enter a valid key for GET operation.', 'error');
        return;
    }
    const { value, hit } = lruCache.get(key);
    if (hit) {
        logMessage(`GET Key: ${key} -> Value: ${value} (Cache HIT)`, 'hit');
        updateVisualization({ highlightKey: key, type: 'hit' });
    } else {
        logMessage(`GET Key: ${key} (Cache MISS)`, 'miss');
        updateVisualization({ highlightKey: key, type: 'miss' }); // Still visualize to show current state
    }
});

putBtn.addEventListener('click', () => {
    const key = parseInt(keyInput.value);
    const value = valueInput.value;

    if (isNaN(key) || value === '') {
        logMessage('Please enter valid Key and Value for PUT operation.', 'error');
        return;
    }

    let actionType = 'new';
    if (lruCache.cache[key]) {
        actionType = 'update';
    }

    const { evictedKey, isUpdate } = lruCache.put(key, value);

    if (evictedKey !== null) {
        logMessage(`Cache Full. Evicted Key: ${evictedKey} to add Key: ${key}`, 'evict');
        // We trigger eviction animation first, then update full viz after a delay
        // This makes the removed item explicitly visible before it's gone.
        const evictedNodeEl = document.querySelector(`.cache-node[data-key="${evictedKey}"]`);
        if (evictedNodeEl) {
            evictedNodeEl.classList.add('highlight-evicted');
            evictedNodeEl.addEventListener('animationend', () => {
                updateVisualization({ highlightKey: key, type: actionType, evictedKey: evictedKey });
            }, { once: true });
        } else {
            // If for some reason the node isn't found, just update normally
            updateVisualization({ highlightKey: key, type: actionType, evictedKey: evictedKey });
        }
    } else {
        if (isUpdate) {
            logMessage(`PUT Key: ${key} -> Value: ${value} (Updated)`, 'info');
            updateVisualization({ highlightKey: key, type: 'update' });
        } else {
            logMessage(`PUT Key: ${key} -> Value: ${value} (Added)`, 'info');
            updateVisualization({ highlightKey: key, type: 'new' });
        }
    }
});

resetBtn.addEventListener('click', () => {
    lruCache.reset();
    logMessage('Cache has been reset.', 'info');
    updateVisualization();
});


// Initial visualization on load
document.addEventListener('DOMContentLoaded', () => {
    updateVisualization();
});