// ==========================================
// ── MUSTNO THEME MANAGER (Global) ──
// ==========================================
const MAX_CUSTOM_THEMES = 10;
let customThemes = JSON.parse(localStorage.getItem('mustno-custom-themes')) || [];
let currentEditId = null;

// 1. MODAL AUTOMATISCH INS HTML INJIZIEREN
function injectThemeModal() {
    if (document.getElementById('custom-theme-modal')) return; // Verhindert doppeltes Einfügen
    const modalHTML = `
    <div id="custom-theme-modal" style="position:fixed; inset:0; z-index:20000; background:rgba(0,0,0,0.85); display:none; align-items:center; justify-content:center; backdrop-filter:blur(8px); font-family:'Space Mono', monospace;">
      <div style="background:#050b16; border:1px solid #4a7aff; padding:25px; border-radius:12px; width:90%; max-width:350px; box-shadow:0 0 30px rgba(0,0,0,0.8);">
        <h3 id="ct-modal-title" style="color:#e4edff; text-align:center; margin-bottom:20px; font-weight:bold; letter-spacing:0.05em;">NEUES THEME ERSTELLEN</h3>
        <div style="margin-bottom:15px;">
            <label style="color:#a0beff; font-size:0.8rem; display:block; margin-bottom:5px;">Theme Name</label>
            <input type="text" id="ct-name" placeholder="Mein Custom Theme" maxlength="15" style="width:100%; padding:8px; background:rgba(255,255,255,0.05); border:1px solid #3c64f0; color:#fff; border-radius:4px; outline:none; font-family:inherit; font-weight:bold;">
        </div>
        <div id="ct-inputs" style="display:flex; flex-direction:column; gap:12px; margin-bottom:25px;"></div>
        <div style="display:flex; gap:10px;">
          <button onclick="closeCustomThemeModal()" style="flex:1; padding:8px; background:transparent; border:1px solid #3c64f0; color:#a0beff; border-radius:6px; cursor:pointer;">Abbrechen</button>
          <button id="ct-btn-delete" onclick="deleteCustomTheme()" style="display:none; padding:8px; background:transparent; border:1px solid #ff4a4a; color:#ff4a4a; border-radius:6px; cursor:pointer;">Löschen</button>
          <button onclick="saveCustomTheme()" style="flex:1; padding:8px; background:#4a7aff; border:none; color:#fff; font-weight:bold; border-radius:6px; cursor:pointer;">Speichern</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 2. PAUSE LOGIK FÜR SPIELE
function pauseAllGames() {
    if (typeof eePaused !== 'undefined' && !eePaused && typeof eeGameOver !== 'undefined' && !eeGameOver) {
        if (document.getElementById('ee-game') && document.getElementById('ee-game').style.display !== 'none') {
            eePaused = true;
            if (typeof drawEESnake === 'function') drawEESnake();
        }
    }
    if (typeof tPaused !== 'undefined' && !tPaused && typeof tGameOver !== 'undefined' && !tGameOver) {
        if (document.getElementById('ee-tetris') && document.getElementById('ee-tetris').style.display !== 'none') {
            tPaused = true;
            if (typeof tDraw === 'function') {
                tDraw();
                window.tCtx.fillStyle='rgba(0,0,0,0.7)'; window.tCtx.fillRect(0,0,200,400);
                window.tCtx.fillStyle=getComputedStyle(document.body).getPropertyValue('--accent').trim(); window.tCtx.font="bold 22px 'Space Mono'"; window.tCtx.textAlign='center'; window.tCtx.fillText('[ PAUSIERT ]', 100, 200);
            }
        }
    }
}

// 3. THEME FARBEN ANWENDEN (Global für alle Seiten)
function applyThemeColors(colors) {
    const root = document.documentElement;
    
    if (colors.bg) {
        root.style.setProperty('--bg', colors.bg);
        root.style.setProperty('--bg-color', colors.bg);
        root.style.setProperty('--bg-deep', colors.bg);
        root.style.setProperty('--term-bg', colors.bg);
        root.style.setProperty('--overlay-bg', `color-mix(in srgb, ${colors.bg} 85%, transparent)`);
        // NEU: Verhindert, dass die dunkle Vignette das Custom Theme überlagert
        root.style.setProperty('--vignette-color', `color-mix(in srgb, ${colors.bg} 40%, transparent)`);
    }
    
    if (colors.accent) {
        root.style.setProperty('--accent', colors.accent);
        // Erzeugt ein passendes Raster basierend auf der Akzentfarbe
        root.style.setProperty('--grid-color', `color-mix(in srgb, ${colors.accent} 15%, transparent)`);
    }
    
    if (colors.text) {
        root.style.setProperty('--text', colors.text);
    }
    
    if (colors.green) {
        root.style.setProperty('--green', colors.green);
    }

    // Setzt den Rahmen (Border), falls im Custom Theme definiert
    if (colors.border) {
        root.style.setProperty('--border-color', colors.border);
    } else if (colors.accent) {
        // Fallback: Nutzt Akzentfarbe für Rahmen, falls kein Border definiert
        root.style.setProperty('--border-color', colors.accent);
    }
}

function clearThemeColors() {
    const root = document.documentElement;
    const props = [
        '--bg', '--proj-bg', '--accent', '--green', '--text', '--border', '--glass',
        '--bg-deep', '--bg-mid', '--bg-card', '--bg-card-hover', '--panel-bg',
        '--accent-green', '--accent-green-dim', '--accent-glow',
        '--text-primary', '--text-dim', '--text-muted',
        '--border-bright', '--grid-line', '--grid-line-bright', '--pixel-border'
    ];
    props.forEach(p => root.style.removeProperty(p));
}
// 4. DROPDOWNS UPDATEN
function updateThemeDropdowns() {
    document.querySelectorAll('.theme-select').forEach(sel => {
        sel.removeEventListener('mousedown', pauseAllGames);
        sel.removeEventListener('touchstart', pauseAllGames);
        sel.addEventListener('mousedown', pauseAllGames);
        sel.addEventListener('touchstart', pauseAllGames);

        sel.innerHTML = ''; 
        sel.add(new Option('Cyber (Default)', ''));
        sel.add(new Option('Wii Style', 'theme-wii'));
        sel.add(new Option('Retro', 'theme-retro'));
        sel.add(new Option('Cyberpunk', 'theme-cyberpunk'));
        
        customThemes.forEach(ct => {
            sel.add(new Option(ct.name, ct.id));
            sel.add(new Option('✎ Bearbeiten: ' + ct.name, 'edit-' + ct.id));
        });
        
        if (customThemes.length < MAX_CUSTOM_THEMES) {
            sel.add(new Option('+ Neues Custom Theme...', 'new-custom'));
        }
        sel.value = localStorage.getItem('mustno-theme') || '';
    });
}

// 5. THEME WECHSELN
window.changeTheme = function(val, isPageLoad = false) {

document.documentElement.className = val;
    if (!isPageLoad) pauseAllGames();
    const prev = localStorage.getItem('mustno-theme') || '';
    
    // Editor NUR öffnen, wenn wir NICHT gerade die Seite neu laden
    if (!isPageLoad && val === prev && val.startsWith('custom-')) { window.openCustomThemeModal(val); return; }
    
    if (val === 'new-custom') { window.openCustomThemeModal(); document.querySelectorAll('.theme-select').forEach(s => s.value = prev); return; }
    if (val.startsWith('edit-')) { const id = val.replace('edit-', ''); window.openCustomThemeModal(id); setTimeout(() => { document.querySelectorAll('.theme-select').forEach(s => s.value = prev); }, 10); return; }

    localStorage.setItem('mustno-theme', val);
    
    
    
    document.querySelectorAll('.theme-select').forEach(s => s.value = val);

    if (val.startsWith('custom-')) {
        document.body.className = 'theme-custom';
        const ct = customThemes.find(t => t.id === val);
        if (ct) applyThemeColors(ct.colors);
    } else {
        document.body.className = val;
        clearThemeColors();
    }
    
    if (typeof playCurrentTrack === 'function') {
        // Musik nur ansteuern, wenn wir das Theme MANUELL wechseln (verhindert Doppel-Play Error)
        if (!isPageLoad) {
            trackIdx = 0; 
            localStorage.setItem('mustno-track-idx', '0'); 
            localStorage.setItem('mustno-bgm-time', '0'); 
            playCurrentTrack();
        }
    }
};

// 6. EDITOR LOGIK
window.openCustomThemeModal = function(editId = null) {
    currentEditId = editId;
    const container = document.getElementById('ct-inputs');
    container.innerHTML = '';
    
    let startColors = { bg: '#050b16', accent: '#4a7aff', green: '#5effa8', text: '#e4edff', border: '#3c64f0' };
    let startName = '';

    if (editId) {
        const existing = customThemes.find(t => t.id === editId);
        if (existing) { startColors = existing.colors; startName = existing.name; }
        document.getElementById('ct-btn-delete').style.display = 'block';
        document.getElementById('ct-modal-title').innerText = 'THEME BEARBEITEN';
    } else {
        document.getElementById('ct-btn-delete').style.display = 'none';
        document.getElementById('ct-modal-title').innerText = 'NEUES THEME ERSTELLEN';
    }

    document.getElementById('ct-name').value = startName;
    const labels = { bg: 'Hintergrund', accent: 'Accent (Primär)', green: 'Highlight (Grün)', text: 'Text Farbe', border: 'Rahmen' };
    
    Object.keys(startColors).forEach(key => {
        container.innerHTML += `
        <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="color:#a0beff; font-size:0.75rem; display:flex; justify-content:space-between; font-family:'Space Mono', monospace;">
                <span>${labels[key]}</span><span style="color:#506eb9; font-size:0.6rem;">HEX / RGB / HSL / NAME</span>
            </label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="color" id="ct-col-${key}" value="${window.cssToHex(startColors[key])}" oninput="document.getElementById('ct-txt-${key}').value=this.value; window.previewCustomTheme();" style="width:36px; height:36px; padding:0; border:1px solid #3c64f0; border-radius:6px; cursor:pointer; background:transparent; flex-shrink:0;">
                <input type="text" id="ct-txt-${key}" value="${startColors[key]}" oninput="window.syncThemeColorPicker('${key}'); window.previewCustomTheme();" style="flex:1; padding:8px; background:rgba(255,255,255,0.05); border:1px solid #3c64f0; color:#fff; font-family:inherit; font-size:0.8rem; border-radius:6px; outline:none;">
            </div>
        </div>`;
    });
    document.getElementById('custom-theme-modal').style.display = 'flex';
};

window.cssToHex = function(cssColor) {
    const dummy = document.createElement('div'); dummy.style.color = cssColor; document.body.appendChild(dummy);
    const computed = window.getComputedStyle(dummy).color; document.body.removeChild(dummy);
    const rgbMatch = computed.match(/\d+/g);
    if(rgbMatch && rgbMatch.length >= 3) {
        return '#' + parseInt(rgbMatch[0]).toString(16).padStart(2,'0') + parseInt(rgbMatch[1]).toString(16).padStart(2,'0') + parseInt(rgbMatch[2]).toString(16).padStart(2,'0');
    }
    return '#ffffff';
};

window.syncThemeColorPicker = function(key) { document.getElementById('ct-col-' + key).value = window.cssToHex(document.getElementById('ct-txt-' + key).value); };

window.previewCustomTheme = function() {
    const tempColors = {};
    ['bg', 'accent', 'green', 'text', 'border'].forEach(key => { tempColors[key] = document.getElementById(`ct-txt-${key}`).value; });
    applyThemeColors(tempColors);
};

window.saveCustomTheme = function() {
    const name = document.getElementById('ct-name').value.trim() || 'Custom Theme';
    const newColors = {};
    ['bg', 'accent', 'green', 'text', 'border'].forEach(key => { newColors[key] = document.getElementById(`ct-txt-${key}`).value; });

    if (currentEditId) {
        const idx = customThemes.findIndex(t => t.id === currentEditId);
        if(idx !== -1) { customThemes[idx].name = name; customThemes[idx].colors = newColors; }
    } else {
        const newId = 'custom-' + Date.now();
        customThemes.push({ id: newId, name: name, colors: newColors });
        currentEditId = newId;
    }

    localStorage.setItem('mustno-custom-themes', JSON.stringify(customThemes));
    updateThemeDropdowns();
    window.changeTheme(currentEditId);
    document.getElementById('custom-theme-modal').style.display = 'none';
    if(typeof toast === 'function') toast('Theme gespeichert!');
};

window.deleteCustomTheme = function() {
    if(!currentEditId) return;
    customThemes = customThemes.filter(t => t.id !== currentEditId);
    localStorage.setItem('mustno-custom-themes', JSON.stringify(customThemes));
    updateThemeDropdowns();
    window.changeTheme(''); 
    document.getElementById('custom-theme-modal').style.display = 'none';
    if(typeof toast === 'function') toast('Theme gelöscht!');
};

window.closeCustomThemeModal = function() {
    document.getElementById('custom-theme-modal').style.display = 'none';
    const active = localStorage.getItem('mustno-theme') || '';
    document.querySelectorAll('.theme-select').forEach(s => s.value = active);
    if (active.startsWith('custom-')) {
        const ct = customThemes.find(t => t.id === active);
        if (ct) applyThemeColors(ct.colors);
    } else {
        clearThemeColors();
    }
    document.documentElement.className = active;
};

// INITIALISIERUNG BEIM LADEN DER SEITE
document.addEventListener('DOMContentLoaded', () => {
    injectThemeModal(); 
    updateThemeDropdowns(); 
    const loadedTheme = localStorage.getItem('mustno-theme') || '';
    if (loadedTheme) window.changeTheme(loadedTheme, true); // true = "Hey, ich lade gerade nur die Seite!"
});

