/* =====================================================
   agenda.js — Agenda Semanal
   Casa Maria de Magdala
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ── 1. DESTAQUE DO DIA ATUAL ── */
  var diasMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
  var diaHoje = diasMap[new Date().getDay()];
  var cabHoje = document.getElementById('cabecalho-' + diaHoje);
  if (cabHoje) cabHoje.classList.add('hoje');

  /* ── 2. REFERÊNCIA AO CARD EM EDIÇÃO ── */
  var _cardEmEdicao = null;

  /* ── 3. MODAL — ADICIONAR ATIVIDADE ── */
  window.abrirModalAtividade = function () {
    document.getElementById('modalAtividade').classList.add('visivel');
  };

  window.fecharModalAtividade = function () {
    document.getElementById('modalAtividade').classList.remove('visivel');
    ['selDia', 'selEspecialidade', 'inputProfissional', 'inputHoraInicio', 'inputHoraFim'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  window.salvarAtividade = function () {
    var dia   = document.getElementById('selDia').value;
    var esp   = document.getElementById('selEspecialidade').value;
    var prof  = document.getElementById('inputProfissional').value.trim();
    var hIni  = document.getElementById('inputHoraInicio').value;
    var hFim  = document.getElementById('inputHoraFim').value;

    if (!dia || !esp) {
      alert('Selecione o dia e a especialidade.');
      return;
    }

    var horario = hIni && hFim ? hIni + '–' + hFim : (hIni || 'A definir');
    var corpo   = document.getElementById('corpo-' + dia);
    if (!corpo) return;

    var card = criarCard(esp, prof || 'A definir', horario, true);
    corpo.appendChild(card);

    fecharModalAtividade();
    mostrarToast('Atividade adicionada!');
  };

  /* ── 4. MODAL — EDITAR ATIVIDADE ── */
  window.editarAtividade = function (btn) {
    _cardEmEdicao = btn.closest('.card-atividade');

    var esp     = _cardEmEdicao.querySelector('.esp-nome').childNodes[0].textContent.trim();
    var prof    = _cardEmEdicao.querySelector('.prof-nome').textContent.trim();
    var horario = _cardEmEdicao.querySelector('.horario').textContent.trim();

    // Preenche o select de especialidade
    var selEsp = document.getElementById('editEsp');
    for (var i = 0; i < selEsp.options.length; i++) {
      if (selEsp.options[i].text === esp) { selEsp.selectedIndex = i; break; }
    }

    document.getElementById('editProf').value = prof === '— A definir' ? '' : prof;

    // Tenta preencher os horários (formato HH:MM–HH:MM)
    var partes = horario.split('–');
    document.getElementById('editHoraInicio').value = partes[0] ? partes[0].trim() : '';
    document.getElementById('editHoraFim').value    = partes[1] ? partes[1].trim() : '';

    document.getElementById('modalEditarAtiv').classList.add('visivel');
    document.getElementById('editProf').focus();
  };

  window.fecharModalEditar = function () {
    document.getElementById('modalEditarAtiv').classList.remove('visivel');
    _cardEmEdicao = null;
  };

  window.salvarEdicaoAtividade = function () {
    if (!_cardEmEdicao) return;

    var esp   = document.getElementById('editEsp').value;
    var prof  = document.getElementById('editProf').value.trim() || '— A definir';
    var hIni  = document.getElementById('editHoraInicio').value;
    var hFim  = document.getElementById('editHoraFim').value;
    var horario = hIni && hFim ? hIni + '–' + hFim : (hIni || 'A definir');

    // Atualiza o card — preserva o badge "Novo" se existir
    var badgeNovo = _cardEmEdicao.querySelector('.badge-novo');
    var badgeHtml = badgeNovo ? ' <span class="badge-novo">Novo</span>' : '';

    _cardEmEdicao.querySelector('.esp-nome').innerHTML = escHtml(esp) + badgeHtml;
    _cardEmEdicao.querySelector('.prof-nome').textContent = prof;
    _cardEmEdicao.querySelector('.horario').textContent   = horario;

    // Atualiza os data-* do botão editar
    var btnEditar = _cardEmEdicao.querySelector('.btn-editar-card');
    if (btnEditar) {
      btnEditar.dataset.esp     = esp;
      btnEditar.dataset.prof    = prof;
      btnEditar.dataset.horario = horario;
    }

    fecharModalEditar();
    mostrarToast('"' + esp + '" atualizado!');
  };

  /* ── 5. EXCLUIR ATIVIDADE ── */
  window.excluirAtividade = function (btn) {
    var card = btn.closest('.card-atividade');
    var nome = card.querySelector('.esp-nome').childNodes[0].textContent.trim();
    if (confirm('Remover "' + nome + '" da agenda?')) {
      card.style.transition = 'opacity 0.3s';
      card.style.opacity    = '0';
      setTimeout(function () { card.remove(); }, 300);
      mostrarToast('"' + nome + '" removido da agenda.');
    }
  };

  /* ── 6. FECHAR MODAIS (clique fora / Esc) ── */
  document.querySelectorAll('.modal-aviso').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('visivel');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-aviso.visivel').forEach(function (m) {
        m.classList.remove('visivel');
      });
      _cardEmEdicao = null;
    }
  });

  /* ── UTILITÁRIOS ── */

  function criarCard(esp, prof, horario, novo) {
    var card = document.createElement('div');
    card.className = 'card-atividade' + (novo ? ' card-novo' : '');
    card.innerHTML =
      '<div class="esp-nome">' + escHtml(esp) + (novo ? ' <span class="badge-novo">Novo</span>' : '') + '</div>' +
      '<div class="prof-nome">' + escHtml(prof) + '</div>' +
      '<span class="horario">' + escHtml(horario) + '</span>' +
      '<div class="card-acoes">' +
        '<button class="btn-editar-card" onclick="editarAtividade(this)" ' +
          'data-esp="' + escAttr(esp) + '" data-prof="' + escAttr(prof) + '" data-horario="' + escAttr(horario) + '" title="Editar">✏️</button>' +
        '<button class="btn-excluir-card" onclick="excluirAtividade(this)" title="Remover">🗑️</button>' +
      '</div>';
    return card;
  }

  function mostrarToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visivel');
    setTimeout(function () { toast.classList.remove('visivel'); }, 3000);
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function escAttr(s) {
    return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

});
