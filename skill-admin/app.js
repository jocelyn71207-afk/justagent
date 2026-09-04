function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
}
document.querySelectorAll('.nav-group-title').forEach(title => {
  title.addEventListener('click', () => title.parentElement.classList.toggle('collapsed'));
});
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-mask').forEach(mask => {
  mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('active'); });
});
function toggleToolSource() {
  const val = document.getElementById('tool-source-select').value;
  document.getElementById('native-tool-fields').style.display = val === 'native' ? 'block' : 'none';
  document.getElementById('mcp-tool-fields').style.display = val === 'mcp' ? 'block' : 'none';
}
function switchAdminMode(mode) {
  document.querySelectorAll('.admin-test-mode').forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
  const el = document.getElementById('admin-mode-' + mode);
  el.classList.add('active'); el.style.display = 'flex';
  document.querySelectorAll('.admin-mode-tab').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function selectTestSkill(el) {
  document.querySelectorAll('.test-skill-opt').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}
function switchRepoTab(panelId) {
  document.querySelectorAll('.repo-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('#repo-tabs .tab-item').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function switchStatsTab(panelId) {
  document.querySelectorAll('.stats-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('#stats-tabs .tab-item').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function switchTestCaseTab(panelId) {
  document.querySelectorAll('.tc-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('#test-case-tabs .tab-item').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
