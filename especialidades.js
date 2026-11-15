/* =====================================================
   especialidades.js — Módulo de Especialidades
   Casa Maria de Magdala
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ─────────────────────────────────────────
     1. FILTRO POR CATEGORIA
  ───────────────────────────────────────── */
  window.filtrarCategoria = function (categoria, botaoClicado) {
    // Atualiza botões
    document.querySelectorAll('.btn-categoria').forEach(function (btn) {
      btn.classList.remove('ativo');
    });
    botaoClicado.classList.add('ativo');

    // Mostra/oculta seções
    document.querySelectorAll('.secao-categoria').forEach(function (secao) {
      secao.style.display = (categoria === 'todas' || secao.dataset.grupo === categoria) ? '' : 'none';
    });
  };

  /* ─────────────────────────────────────────
     2. MODAL — NOVA ESPECIALIDADE
  ───────────────────────────────────────── */
  window.abrirModalNovaEspecialidade = function () {
    document.getElementById('modalNovaEsp').classList.add('visivel');
    document.getElementById('novaEspNome').focus();
  };

  window.fecharModalNovaEsp = function () {
    document.getElementById('modalNovaEsp').classList.remove('visivel');
    // limpa campos
    document.getElementById('novaEspNome').value      = '';
    document.getElementById('novaEspCategoria').value = '';
    document.getElementById('novaEspDesc').value      = '';
  };

  window.salvarNovaEsp = function () {
    var nome      = document.getElementById('novaEspNome').value.trim();
    var categoria = document.getElementById('novaEspCategoria').value;
    var desc      = document.getElementById('novaEspDesc').value.trim();

    if (!nome) {
      mostrarErro('novaEspNome', 'Informe o nome da especialidade.');
      return;
    }
    if (!categoria) {
      mostrarErro('novaEspCategoria', 'Selecione uma categoria.');
      return;
    }

    // Adiciona card na grade correta
    var grade = document.querySelector('.secao-categoria[data-grupo="' + categoria + '"] .grade-especialidades');
    if (grade) {
      var idx = Date.now(); // id único para edição posterior
      var card = document.createElement('div');
      card.className = 'card-especialidade';
      card.dataset.idx = idx;
      card.innerHTML = montarCardHtml(nome, desc || 'Sem descrição.', 'ativo', idx);
      grade.appendChild(card);
    }

    // (aqui reside o django) -> Salva tb no BD Python/Django (tabela Especialidades do Luiz!)
    fetch(((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/especialidades/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'criar', nome: nome, categoria: categoria, status: 'ativo' })
    }).catch(function () {});

    fecharModalNovaEsp();
    mostrarToast('Especialidade "' + nome + '" cadastrada no Banco!');
  };

  /* ─────────────────────────────────────────
     3. MODAL — EDITAR ESPECIALIDADE
  ───────────────────────────────────────── */
  window.abrirEdicaoEspecialidade = function (nomeAtual, descAtual, statusAtual, cardEl) {
    // Guarda referência ao card sendo editado
    window._cardEmEdicao = cardEl;

    document.getElementById('editEspNome').value   = nomeAtual;
    document.getElementById('editEspDesc').value   = descAtual;
    document.getElementById('editEspStatus').value = statusAtual; // 'ativo' ou 'inativo'

    document.getElementById('modalEditarEsp').classList.add('visivel');
    document.getElementById('editEspNome').focus();
  };

  window.fecharModalEditarEsp = function () {
    document.getElementById('modalEditarEsp').classList.remove('visivel');
    window._cardEmEdicao = null;
  };

  window.salvarEdicaoEsp = function () {
    var nome   = document.getElementById('editEspNome').value.trim();
    var desc   = document.getElementById('editEspDesc').value.trim();
    var status = document.getElementById('editEspStatus').value;

    if (!nome) {
      mostrarErro('editEspNome', 'O nome não pode ficar vazio.');
      return;
    }

    var card = window._cardEmEdicao;
    if (!card) return;
    var nomeAntigo = card.querySelector('.esp-nome') ? card.querySelector('.esp-nome').textContent.trim() : nome;

    // (aqui reside o django) -> Atualiza tb no BD Python/Django (tabela Especialidades do Luiz!)
    fetch(((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/especialidades/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'editar', nome_antigo: nomeAntigo, nome: nome, status: status })
    }).catch(function () {});

    // Atualiza o card na tela sem recarregar
    card.querySelector('.esp-nome').textContent = nome;
    card.querySelector('.esp-desc').textContent = desc || 'Sem descrição.';

    var badge = card.querySelector('.esp-badge');
    badge.className = 'esp-badge ' + (status === 'ativo' ? 'badge-ativo' : 'badge-inativo');
    badge.textContent = status === 'ativo' ? 'Ativa' : 'Inativa';

    // Atualiza os parâmetros do botão editar para refletir os novos valores
    var btnEditar = card.querySelector('.btn-editar-esp');
    if (btnEditar) {
      btnEditar.setAttribute('onclick',
        'abrirEdicaoEspecialidade("' + escaparAttr(nome) + '","' + escaparAttr(desc) + '","' + status + '", this.closest(".card-especialidade"))');
    }

    fecharModalEditarEsp();
    mostrarToast('"' + nome + '" atualizada com sucesso!');
  };

  /* ─────────────────────────────────────────
     4. VINCULAR BOTÕES DE EDITAR JÁ EXISTENTES
        (cards que já estão no HTML)
  ───────────────────────────────────────── */
  document.querySelectorAll('.card-especialidade').forEach(function (card) {
    var btnEditar = card.querySelector('.btn-acao-esp[title="Editar"]');
    if (btnEditar) {
      btnEditar.classList.add('btn-editar-esp');
      btnEditar.addEventListener('click', function () {
        var nome   = card.querySelector('.esp-nome').textContent.trim();
        var desc   = card.querySelector('.esp-desc') ? card.querySelector('.esp-desc').textContent.trim() : '';
        var badge  = card.querySelector('.esp-badge');
        var status = badge && badge.classList.contains('badge-ativo') ? 'ativo' : 'inativo';
        abrirEdicaoEspecialidade(nome, desc, status, card);
      });
    }
  });

  /* ─────────────────────────────────────────
     5. FECHAR MODAIS AO CLICAR FORA / ESC
  ───────────────────────────────────────── */
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
    }
  });

  /* ─────────────────────────────────────────
     UTILITÁRIOS
  ───────────────────────────────────────── */

  // Monta o HTML interno de um card novo
  function montarCardHtml(nome, desc, status, idx) {
    var badgeClass = status === 'ativo' ? 'badge-ativo' : 'badge-inativo';
    var badgeLabel = status === 'ativo' ? 'Ativa' : 'Inativa';
    return (
      '<div class="esp-topo">' +
        '<span class="esp-nome">' + escaparHtml(nome) + '</span>' +
        '<span class="esp-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
      '</div>' +
      '<p class="esp-desc">' + escaparHtml(desc) + '</p>' +
      '<div class="esp-rodape">' +
        '<span class="esp-atendimentos">0 atendimentos ativos</span>' +
        '<div class="esp-acoes">' +
          '<button class="btn-acao-esp btn-editar-esp" title="Editar" ' +
            'onclick="abrirEdicaoEspecialidade(\'' + escaparAttr(nome) + '\',\'' + escaparAttr(desc) + '\',\'' + status + '\',this.closest(\'.card-especialidade\'))">' +
            '✏️ Editar' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }

  // Toast de sucesso
  function mostrarToast(mensagem) {
    var toast = document.getElementById('toastEsp');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastEsp';
      toast.className = 'toast-sucesso';
      document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.classList.add('visivel');
    setTimeout(function () { toast.classList.remove('visivel'); }, 3200);
  }

  // Destaca campo com erro brevemente
  function mostrarErro(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#ef4444';
    el.focus();
    setTimeout(function () { el.style.borderColor = ''; }, 2000);
    alert(msg);
  }

  // Escapa HTML para segurança
  function escaparHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Escapa para uso dentro de atributos onclick com aspas simples
  function escaparAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

});
