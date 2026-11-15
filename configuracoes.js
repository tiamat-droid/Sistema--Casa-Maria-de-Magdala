// configuracoes.js — Módulo Configurações

document.addEventListener('DOMContentLoaded', function () {

  var toastEl = document.getElementById('toastSucesso');

  function mostrarToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('visivel');
    setTimeout(function () {
      toastEl.classList.remove('visivel');
    }, 3200);
  }

  // ── Salvar Configurações ─────────────────────────
  window.salvarConfig = function () {
    mostrarToast('Configurações salvas com sucesso!');
  };

  // ── Limpar Log ───────────────────────────────────
  window.limparLog = function () {
    mostrarToast('Log não pode ser apagado por usuário comum.');
  };

});
