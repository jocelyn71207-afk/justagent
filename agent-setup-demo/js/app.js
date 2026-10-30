window.appState = {
  data: cloneSeed(),
  selection: { npcCode: null, variantCode: null },
  uiState: {
    expandedNpcs: {},
    creatingNpc: false,
    npcFormError: null,
    creatingVariantFor: null,
    variantFormError: null,
    editingNpcBasics: false,
    addingModelKind: null,
    modelParamEdits: {},
    modelParamErrors: {},
    variantSnapshots: {},
    bagDetail: null,
    bagDetailEditing: null,
    bagDetailGemsDraft: null,
    bagDetailError: null,
    bagDetailCreateForm: null,
    bagMode: 'bag',
    packDetail: null,
    packDetailEditing: null,
    packMembershipDraft: null,
    packDetailError: null,
    packCreateForm: null,
    packListKind: 'bundle',
    bagVersionPick: {}
  }
};

function render() {
  document.getElementById('ws-nav').innerHTML = renderNavTree(window.appState);
  document.getElementById('ws-center').innerHTML = renderCenterPane(window.appState);
  var sel = window.appState.selection;
  document.getElementById('ws-bag').innerHTML = sel.variantCode
    ? renderBagForVariant(window.appState)
    : (sel.npcCode ? renderNpcSidePane(window.appState) : renderBagPlaceholder());
  renderNpcPane(window.appState);
  renderModelSection(window.appState);
  renderVariantPane(window.appState);
  renderAbilityArea(window.appState);
  renderBagDetailFlyout(window.appState);
}

window.rerender = render;

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (window.appState.uiState.bagDetail) wsCloseBagDetail();
  if (window.appState.uiState.packDetail) wsClosePackDetail();
});

window.resetData = function resetData() {
  window.appState.data = cloneSeed();
  window.appState.selection = { npcCode: null, variantCode: null };
  window.appState.uiState = {
    expandedNpcs: {},
    creatingNpc: false,
    npcFormError: null,
    creatingVariantFor: null,
    variantFormError: null,
    editingNpcBasics: false,
    addingModelKind: null,
    modelParamEdits: {},
    modelParamErrors: {},
    variantSnapshots: {},
    bagDetail: null,
    bagDetailEditing: null,
    bagDetailGemsDraft: null,
    bagDetailError: null,
    bagDetailCreateForm: null,
    bagMode: 'bag',
    packDetail: null,
    packDetailEditing: null,
    packMembershipDraft: null,
    packDetailError: null,
    packCreateForm: null,
    packListKind: 'bundle',
    bagVersionPick: {}
  };
  render();
};

render();
