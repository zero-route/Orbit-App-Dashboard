export const adminCss = `
:root{color-scheme:dark;--bg:#0b0d13;--card:#141824;--line:#222839;--text:#e8ebf4;--mute:#8b93a8;--accent:#6ea8ff;--bad:#ff6b6b;--ok:#4ade80}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.45 system-ui,sans-serif}
a{color:var(--accent);text-decoration:none}
.wrap{max-width:760px;margin:0 auto;padding:16px}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.top h1{font-size:18px;margin:0}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px}
.stat b{display:block;font-size:22px}
.stat span{color:var(--mute);font-size:12px}
.tabs{display:flex;gap:8px;margin-bottom:14px;overflow-x:auto}
.tab{padding:8px 14px;border-radius:999px;border:1px solid var(--line);color:var(--mute);white-space:nowrap}
.tab.on{background:var(--accent);color:#07101f;border-color:var(--accent);font-weight:600}
.chips{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto}
.chip{padding:4px 10px;border-radius:999px;border:1px solid var(--line);color:var(--mute);font-size:12px;white-space:nowrap}
.chip.on{color:var(--text);border-color:var(--accent)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px}
.row{display:flex;justify-content:space-between;gap:8px;align-items:center;color:var(--mute);font-size:12px}
.url{word-break:break-all;margin:8px 0;font-size:14px}
.badge{padding:2px 8px;border-radius:999px;background:#1d2335;color:var(--text);font-size:11px}
.bad{color:var(--bad)}
.ok{color:var(--ok)}
.mono{font-family:ui-monospace,monospace;font-size:12px;word-break:break-all}
form.inline{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center}
input[type=text],input[type=password]{flex:1;min-width:120px;background:#0e1220;border:1px solid var(--line);border-radius:8px;padding:9px;color:var(--text);font-size:14px}
button{background:#1f2640;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:9px 12px;font-size:13px;cursor:pointer}
button.danger{background:#3a1820;border-color:#5a2430;color:#ffb3b3}
button.primary{background:var(--accent);border-color:var(--accent);color:#07101f;font-weight:600}
.note{color:var(--mute);font-size:12px;margin:6px 0 14px}
.err{color:var(--bad);margin:0 0 10px}
.login{max-width:360px;margin:12vh auto;padding:0 16px}
.empty{color:var(--mute);text-align:center;padding:24px}
`;
