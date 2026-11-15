/* =====================================================
   profissionais.js — Módulo de Profissionais
   c/ comentários informais p/ facilitar o entendimento ;)
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // Guarda a linha <tr> q está sendo editada (null = novo cadastro)
  let linhaEmEdicao = null;

  /* ── 1. MÁSCARA DE TELEFONE ── */
  const telInput = document.getElementById('telefoneProfissional');
  if (telInput) {
    telInput.addEventListener('input', function (e) {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.substring(0, 11);

      if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{1,4})$/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{1,5})$/, '($1) $2');
      } else if (v.length > 0) {
        v = '(' + v;
      }
      e.target.value = v;
    });
  }

  /* ── 2. FILTRO DE PROFISSIONAIS (BUSCA RÁPIDA) ── */
  window.filtrarProfissionais = function () {
    const inputBusca = document.getElementById('buscaProf');
    const termo = inputBusca ? normalizarTexto(inputBusca.value.trim()) : '';
    const linhas = document.querySelectorAll('#corpoProfissionais tr');

    linhas.forEach(function (linha) {
      const dataBusca = normalizarTexto(linha.getAttribute('data-busca') || linha.textContent || '');
      linha.style.display = (!termo || dataBusca.includes(termo)) ? '' : 'none';
    });
  };

  /* ── 3. MODAL DE CADASTRO / EDIÇÃO ── */
  window.abrirModalCadastroProfissional = function () {
    linhaEmEdicao = null;
    const modal = document.getElementById('modalCadastroProfissional');
    if (modal) {
      const h2 = modal.querySelector('h2');
      if (h2) h2.textContent = 'Cadastrar Profissional';
      modal.classList.add('visivel');
      const nomeInput = document.getElementById('nomeProfissional');
      if (nomeInput) nomeInput.focus();
    }
  };

  window.fecharModalCadastroProfissional = function () {
    linhaEmEdicao = null;
    const modal = document.getElementById('modalCadastroProfissional');
    if (modal) {
      modal.classList.remove('visivel');
      modal.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.tagName === 'SELECT' && el.multiple) {
          Array.from(el.options).forEach(function (opt) { opt.selected = false; });
        } else {
          el.value = '';
        }
      });
    }
  };

  /* ── 4. SALVAR PROFISSIONAL (NOVO OU EDITADO) ── */
  window.salvarProfissional = function () {
    const nomeEl = document.getElementById('nomeProfissional');
    const especEl = document.getElementById('especialidadeProfissional');
    const telEl = document.getElementById('telefoneProfissional');
    const emailEl = document.getElementById('emailProfissional');
    const regEl = document.getElementById('registroProfissional');

    const nome = nomeEl ? nomeEl.value.trim() : '';
    if (!nome) {
      alert('Por favor, informe o nome completo do profissional.');
      if (nomeEl) nomeEl.focus();
      return;
    }

    const especialidadesNomes = [];
    if (especEl) {
      Array.from(especEl.selectedOptions).forEach(function (opt) {
        especialidadesNomes.push(opt.textContent.trim());
      });
    }
    if (especialidadesNomes.length === 0) {
      alert('Por favor, selecione ao menos uma especialidade.');
      if (especEl) especEl.focus();
      return;
    }

    const tel = telEl ? telEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const reg = regEl ? regEl.value.trim() : '';

    let contatoTexto = '—';
    if (tel && email) contatoTexto = tel + ' / ' + email;
    else if (tel) contatoTexto = tel;
    else if (email) contatoTexto = email;

    const tagsHtml = especialidadesNomes.map(function (esp) {
      return '<span class="tag-espec">' + escaparHtml(esp) + '</span>';
    }).join(' ');

    const buscaStr = normalizarTexto(nome + ' ' + especialidadesNomes.join(' ') + ' ' + reg + ' ' + contatoTexto);

    if (linhaEmEdicao) {
      // Atualiza a linha q estava sendo editada
      linhaEmEdicao.setAttribute('data-busca', buscaStr);
      linhaEmEdicao.cells[0].innerHTML = '<strong>' + escaparHtml(nome) + '</strong>';
      linhaEmEdicao.cells[1].innerHTML = tagsHtml;
      linhaEmEdicao.cells[2].textContent = contatoTexto;
      const btnEdit = linhaEmEdicao.querySelector('.btn-tabela');
      if (btnEdit) btnEdit.setAttribute('onclick', "abrirEdicaoProfissional('" + escaparAttr(nome) + "', this)");

      fecharModalCadastroProfissional();
      mostrarToast('toastProfissional', 'Profissional "' + nome + '" atualizado com sucesso!');
      if (window.salvarEstadoPagina) window.salvarEstadoPagina();
      return;
    }

    // Cria nova <tr> se for cadastro novo
    const corpo = document.getElementById('corpoProfissionais');
    if (corpo) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-busca', buscaStr);
      tr.innerHTML =
        '<td><strong>' + escaparHtml(nome) + '</strong></td>' +
        '<td>' + tagsHtml + '</td>' +
        '<td>' + escaparHtml(contatoTexto) + '</td>' +
        '<td><span class="badge-status badge-ativo">Ativo</span></td>' +
        '<td class="acoes-tabela">' +
          '<button class="btn-tabela" onclick="abrirEdicaoProfissional(\'' + escaparAttr(nome) + '\', this)" title="Editar">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ' +
            'Editar' +
          '</button> ' +
          '<a href="agenda.html" class="btn-tabela" title="Ver agenda">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' +
            'Agenda' +
          '</a>' +
        '</td>';

      corpo.appendChild(tr);

      const contador = document.querySelector('.painel-topo h1 span');
      if (contador) {
        const total = corpo.querySelectorAll('tr').length;
        contador.textContent = total + ' cadastrado' + (total === 1 ? '' : 's');
      }
    }

    fecharModalCadastroProfissional();
    mostrarToast('toastProfissional', 'Profissional "' + nome + '" cadastrado com sucesso!');
    if (window.salvarEstadoPagina) window.salvarEstadoPagina();
  };

  /* ── 5. EDIÇÃO REAL DE PROFISSIONAL (preenche o modal c/ os dados da linha!) ── */
  window.abrirEdicaoProfissional = function (nome, btnEl) {
    // Acha a linha <tr> clicada (pelo botão ou pelo nome)
    let tr = btnEl ? btnEl.closest('tr') : null;
    if (!tr) {
      document.querySelectorAll('#corpoProfissionais tr').forEach(function (linha) {
        const strong = linha.querySelector('strong');
        if (strong && strong.textContent.trim() === nome) tr = linha;
      });
    }
    if (!tr) return;

    linhaEmEdicao = tr;
    const modal = document.getElementById('modalCadastroProfissional');
    if (!modal) return;

    const h2 = modal.querySelector('h2');
    if (h2) h2.textContent = 'Editar Profissional';

    const nomeAtual = tr.cells[0].textContent.trim();
    const contatoAtual = tr.cells[2].textContent.trim();
    const especsAtuais = Array.from(tr.cells[1].querySelectorAll('.tag-espec')).map(function (el) {
      return normalizarTexto(el.textContent.trim());
    });

    document.getElementById('nomeProfissional').value = nomeAtual;

    // Marca as especialidades q o prof já tem
    const especEl = document.getElementById('especialidadeProfissional');
    if (especEl) {
      Array.from(especEl.options).forEach(function (opt) {
        opt.selected = especsAtuais.includes(normalizarTexto(opt.textContent.trim()));
      });
    }

    // Preenche tel e email se tiver
    const telEl = document.getElementById('telefoneProfissional');
    const emailEl = document.getElementById('emailProfissional');
    if (contatoAtual && contatoAtual !== '—') {
      const partes = contatoAtual.split('/').map(function (s) { return s.trim(); });
      partes.forEach(function (p) {
        if (p.includes('@')) { if (emailEl) emailEl.value = p; }
        else { if (telEl) telEl.value = p; }
      });
    } else {
      if (telEl) telEl.value = '';
      if (emailEl) emailEl.value = '';
    }

    modal.classList.add('visivel');
    document.getElementById('nomeProfissional').focus();
  };

  /* ── 6. TOAST REUTILIZÁVEL ── */
  window.mostrarToast = function (id, mensagem) {
    let toast = (id && document.getElementById(id)) ? document.getElementById(id) : document.querySelector('.toast-sucesso');
    let texto = mensagem || id || 'Ação realizada com sucesso!';
    if (!toast) return;
    toast.textContent = texto;
    toast.classList.add('visivel');
    setTimeout(function () { toast.classList.remove('visivel'); }, 3200);
  };

  /* ── 7. FECHAR MODAIS CLICANDO FORA OU COM ESC ── */
  const modalCadastro = document.getElementById('modalCadastroProfissional');
  if (modalCadastro) {
    modalCadastro.addEventListener('click', function (e) {
      if (e.target === modalCadastro) fecharModalCadastroProfissional();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.querySelector('.modal-aviso.visivel')) fecharModalCadastroProfissional();
    }
  });

  function normalizarTexto(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function escaparHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escaparAttr(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }
});
