// THE HIVE - Goals & Tasks Manager

let goals = [];
let editingGoalId = null;

// Load goals on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
});

async function loadGoals() {
    try {
        const response = await fetch('/api/goals');
        const data = await response.json();
        goals = data.goals || [];
        renderGoals();
        updateGoalCount();
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

async function createGoal() {
    const titleInput = document.getElementById('goal-title');
    const descInput = document.getElementById('goal-description');
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title) {
        titleInput.style.borderColor = 'var(--neon-pink)';
        setTimeout(() => { titleInput.style.borderColor = ''; }, 1000);
        return;
    }

    try {
        const response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();
        if (data.success) {
            titleInput.value = '';
            descInput.value = '';
            // Flash success
            titleInput.style.borderColor = 'var(--neon-green)';
            setTimeout(() => { titleInput.style.borderColor = ''; }, 500);
            loadGoals();
        }
    } catch (error) {
        console.error('Error creating goal:', error);
    }
}

async function updateGoalStatus(goalId, newStatus) {
    try {
        const response = await fetch(`/api/goals/${goalId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (data.success) {
            loadGoals();
        }
    } catch (error) {
        console.error('Error updating goal status:', error);
    }
}

async function deleteGoal(goalId) {
    if (!confirm('Delete this goal? This cannot be undone.')) return;

    try {
        const response = await fetch(`/api/goals/${goalId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            loadGoals();
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
    }
}

function startEdit(goalId) {
    editingGoalId = goalId;
    renderGoals();

    // Focus the title input
    const titleEl = document.getElementById(`edit-title-${goalId}`);
    if (titleEl) titleEl.focus();
}

function cancelEdit() {
    editingGoalId = null;
    renderGoals();
}

async function saveEdit(goalId) {
    const titleInput = document.getElementById(`edit-title-${goalId}`);
    const descInput = document.getElementById(`edit-desc-${goalId}`);

    const title = titleInput.value.trim();
    if (!title) {
        titleInput.style.borderColor = 'var(--neon-pink)';
        setTimeout(() => { titleInput.style.borderColor = ''; }, 1000);
        return;
    }

    try {
        const response = await fetch(`/api/goals/${goalId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description: descInput.value.trim()
            })
        });

        const data = await response.json();
        if (data.success) {
            editingGoalId = null;
            loadGoals();
        }
    } catch (error) {
        console.error('Error saving goal edit:', error);
    }
}

function renderGoals() {
    const container = document.getElementById('goals-list');
    container.innerHTML = '';

    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-title">No goals yet</div>
                Create your first goal above. MOLTBOT will be able to coordinate work on each goal across all 6 terminals.
            </div>`;
        return;
    }

    goals.forEach(goal => {
        const card = document.createElement('div');
        card.className = `goal-card status-${goal.status}`;

        if (editingGoalId === goal.id) {
            card.innerHTML = `
                <div class="goal-header">
                    <span class="goal-number">#${goal.number}</span>
                    <input type="text" class="edit-title-input" id="edit-title-${goal.id}"
                           value="${escapeAttr(goal.title)}" />
                    <div class="goal-actions">
                        <button class="goal-action-btn save" onclick="saveEdit('${goal.id}')">Save</button>
                        <button class="goal-action-btn" onclick="cancelEdit()">Cancel</button>
                    </div>
                </div>
                <textarea class="edit-desc-textarea" id="edit-desc-${goal.id}">${escapeHtml(goal.description)}</textarea>
            `;
        } else {
            const statusOptions = ['pending', 'in_progress', 'completed'];
            const statusSelect = statusOptions.map(s =>
                `<option value="${s}" ${s === goal.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
            ).join('');

            card.innerHTML = `
                <div class="goal-header">
                    <span class="goal-number">#${goal.number}</span>
                    <span class="goal-title">${escapeHtml(goal.title)}</span>
                    <select class="goal-status-select" onchange="updateGoalStatus('${goal.id}', this.value)">
                        ${statusSelect}
                    </select>
                    <div class="goal-actions">
                        <button class="goal-action-btn" onclick="startEdit('${goal.id}')">Edit</button>
                        <button class="goal-action-btn delete" onclick="deleteGoal('${goal.id}')">Delete</button>
                    </div>
                </div>
                ${goal.description ? `<div class="goal-description">${escapeHtml(goal.description)}</div>` : ''}
                <div class="goal-meta">Created ${formatDate(goal.createdAt)}${goal.updatedAt !== goal.createdAt ? ' | Updated ' + formatDate(goal.updatedAt) : ''}</div>
            `;
        }

        container.appendChild(card);
    });
}

function updateGoalCount() {
    const countEl = document.getElementById('goal-count');
    if (countEl) {
        const pending = goals.filter(g => g.status === 'pending').length;
        const active = goals.filter(g => g.status === 'in_progress').length;
        const done = goals.filter(g => g.status === 'completed').length;
        countEl.textContent = `${goals.length} goal${goals.length !== 1 ? 's' : ''} (${active} active, ${pending} pending, ${done} done)`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to create goal from form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeEl = document.activeElement;
        if (activeEl.id === 'goal-title' || activeEl.id === 'goal-description') {
            e.preventDefault();
            createGoal();
        }
        // Ctrl+Enter to save edit
        if (activeEl.id && activeEl.id.startsWith('edit-')) {
            e.preventDefault();
            const goalId = activeEl.id.replace('edit-title-', '').replace('edit-desc-', '');
            saveEdit(goalId);
        }
    }

    // Escape to cancel edit
    if (e.key === 'Escape' && editingGoalId) {
        cancelEdit();
    }
});
