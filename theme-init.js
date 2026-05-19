// FOUC-Prävention & Theme-Synchronisation
// Lade dieses Skript im <head> ALLER HTML-Dateien!

(function() {
    const activeTheme = localStorage.getItem('mustno-theme') || '';
    
    // 1. Theme-Klassen sofort anwenden (verhindert FOUC / Flackern)
    if (activeTheme) {
        document.documentElement.className = activeTheme;
        
        // Sobald der <body> existiert, auch dort die Klasse hinzufügen (wichtig für body.theme-xyz CSS-Regeln)
        const observer = new MutationObserver((mutations, obs) => {
            if (document.body) {
                document.body.className = activeTheme;
                
                // DER FIX: Erzwingt Sync zwischen Body und HTML für das Audio-Widget
                const sync = () => { document.documentElement.className = document.body.className; };
                new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
                
                obs.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }



    // 2. CSS-Brücke für die Music Bar erstellen
    // index.html nutzt --bg/--text, Lab.html nutzt --bg-card/--text-primary.
    // Das sorgt für eine einheitliche Optik der Audio-Elemente auf JEDER Seite.
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --m-bg: var(--bg, var(--bg-card, #0a1628));
            --m-text: var(--text, var(--text-primary, #e4edff));
            --m-accent: var(--accent, #4a7aff);
        }

        /* Spezifische Theme-Overrides (z.B. für das Wii-Theme) */
        html.theme-wii, body.theme-wii {
            --m-bg: #f4f4f4 !important;
            --m-text: #444444 !important;
            --m-accent: #00baff !important;
        }

        /* Wende synchronisierte Variablen auf alle Audio/Music-Bar IDs & Klassen an */
        #audio-widget, .audio-widget-container, .music-bar, #music-bar {
            background-color: var(--m-bg) !important;
            color: var(--m-text) !important;
            border-color: color-mix(in srgb, var(--m-accent) 30%, transparent) !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
        }

        .audio-progress-bg, #bgm-progress-container {
            background-color: color-mix(in srgb, var(--m-accent) 25%, transparent) !important;
        }

        .audio-progress-fill, #bgm-progress-bar, .seekbar-fill {
            background-color: var(--m-accent) !important;
        }

        .audio-btn, .music-btn {
            color: var(--m-text) !important;
        }
        .audio-btn:hover, .music-btn:hover {
            color: var(--m-accent) !important;
        }
    `;
    // Sofort in den Head injecten (noch bevor <body> rendert)
    document.head.appendChild(style);

    // 3. Custom Themes sofort laden
    if (activeTheme.startsWith('custom-')) {
        try {
            const customThemes = JSON.parse(localStorage.getItem('mustno-custom-themes')) || [];
            const ct = customThemes.find(t => t.id === activeTheme);
            if (ct && ct.colors) {
                const root = document.documentElement;
                // Mappe Farben auf ALLE Variablen-Benennungen über die HTMLs hinweg
                if (ct.colors.bg) {
                    root.style.setProperty('--bg', ct.colors.bg);
                    root.style.setProperty('--bg-deep', ct.colors.bg);
                    root.style.setProperty('--bg-mid', ct.colors.bg);
                    root.style.setProperty('--bg-card', ct.colors.bg);
                }
                if (ct.colors.accent) root.style.setProperty('--accent', ct.colors.accent);
                if (ct.colors.text) {
                    root.style.setProperty('--text', ct.colors.text);
                    root.style.setProperty('--text-primary', ct.colors.text);
                }
                if (ct.colors.green) root.style.setProperty('--green', ct.colors.green);
            }
        } catch(e) {
            console.error("Custom Theme Load Error:", e);
        }
    }
})();
