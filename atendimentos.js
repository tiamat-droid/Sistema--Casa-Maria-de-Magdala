/* =====================================================
   atendimentos.js — Módulo de Atendimentos
   Casa Maria de Magdala
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  let situacaoAtual = 'ativo';

  /* ─────────────────────────────────────────
     1. FILTRO POR SITUAÇÃO (ABAS)
  ───────────────────────────────────────── */
  window.filtrarSituacao = function (situacao, btn) {
    situacaoAtual = situacao;

    if (btn) {
      document.querySelectorAll('.tab-atend').forEach(function (tab) {
        tab.classList.remove('ativo');
      });
      btn.classList.add('ativo');
    }

    const linhas = document.querySelectorAll('#corpoAtendimentos tr');
    linhas.forEach(function (linha) {
      const sitLinha = linha.getAttribute('data-situacao');
      if (situacao === 'todos' || sitLinha === situacao) {
        linha.style.display = '';
      } else {
        linha.style.display = 'none';
      }
    });
  };

  /* ─────────────────────────────────────────
     2. MODAL NOVO ATENDIMENTO
  ───────────────────────────────────────── */
  window.abrirNovoAtendimento = function () {
    const modal = document.getElementById('modalNovoAtend');
    if (modal) {
      modal.classList.add('visivel');
      const dataInput = document.getElementById('novoAtendDate');
      if (dataInput && !dataInput.value) {
        // Data de hoje no formato YYYY-MM-DD
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        dataInput.value = ano + '-' + mes + '-' + dia;
      }
      const pessoaSelect = document.getElementById('novoAtendPessoa');
      if (pessoaSelect) pessoaSelect.focus();
    }
  };

  window.fecharNovoAtendimento = function () {
    const modal = document.getElementById('modalNovoAtend');
    if (modal) {
      modal.classList.remove('visivel');
      const pessoa = document.getElementById('novoAtendPessoa');
      if (pessoa) pessoa.value = '';
      const espec = document.getElementById('novoAtendEspecialidade');
      if (espec) espec.value = '';
      const prof = document.getElementById('novoAtendProfissional');
      if (prof) prof.value = '';
      const data = document.getElementById('novoAtendDate');
      if (data) data.value = '';
    }
  };

  window.salvarNovoAtendimento = function () {
    const pessoaEl = document.getElementById('novoAtendPessoa');
    const especEl = document.getElementById('novoAtendEspecialidade');
    const profEl = document.getElementById('novoAtendProfissional');
    const dataEl = document.getElementById('novoAtendDate');

    const pessoa = pessoaEl ? pessoaEl.value.trim() : '';
    const especialidade = especEl ? especEl.value.trim() : '';
    const profissional = profEl && profEl.value.trim() ? profEl.value.trim() : '—';
    let dataInicioVal = dataEl ? dataEl.value.trim() : '';

    if (!pessoa) {
      alert('Por favor, selecione a pessoa atendida.');
      if (pessoaEl) pessoaEl.focus();
      return;
    }

    if (!especialidade) {
      alert('Por favor, selecione a especialidade.');
      if (especEl) especEl.focus();
      return;
    }

    if (!dataInicioVal) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      dataInicioVal = ano + '-' + mes + '-' + dia;
    }

    // Formata YYYY-MM-DD para DD/MM/YYYY
    let dataFormatada = dataInicioVal;
    if (dataInicioVal.includes('-')) {
      const partes = dataInicioVal.split('-');
      dataFormatada = partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    const corpo = document.getElementById('corpoAtendimentos');
    if (corpo) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-situacao', 'ativo');
      tr.setAttribute('data-nome', pessoa);
      tr.setAttribute('data-especialidade', especialidade);
      tr.setAttribute('data-inicio', dataFormatada);

      tr.innerHTML =
        '<td><strong>' + escaparHtml(pessoa) + '</strong></td>' +
        '<td>' + escaparHtml(especialidade) + '</td>' +
        '<td>' + escaparHtml(profissional) + '</td>' +
        '<td>' + escaparHtml(dataFormatada) + '</td>' +
        '<td><span class="badge-status badge-ativo">Ativo</span></td>' +
        '<td class="acoes-tabela">' +
          '<button type="button" class="btn-acao-tabela btn-registrar-alta" onclick="registrarAlta(\'' + escaparAttr(pessoa) + '\', \'' + escaparAttr(especialidade) + '\', \'' + dataFormatada + '\')">Registrar Alta</button> ' +
          '<a href="pessoas.html" class="btn-acao-tabela">Ver Ficha</a>' +
        '</td>';

      corpo.appendChild(tr);
    }

    // (aqui reside o django) -> Salva tb no BD Python/Django (tabelas Acompanhamento e Atendimento do Luiz!)
    fetch(((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/atendimentos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'criar',
        pessoa: pessoa,
        especialidade: especialidade,
        data_inicio: dataInicioVal,
        observacoes: 'Profissional: ' + profissional
      })
    }).catch(function () {});

    atualizarContadoresAbas();
    fecharNovoAtendimento();
    mostrarToast('toastAtendimentos', 'Atendimento salvo no Banco para ' + pessoa + '!');

    // Reaplica filtro ativo para exibir de acordo com a aba selecionada
    const tabAtiva = document.querySelector('.tab-atend.ativo');
    if (tabAtiva) {
      filtrarSituacao(tabAtiva.getAttribute('data-tab') || 'ativo', null);
    }
  };

  /* ─────────────────────────────────────────
     3. MODAL REGISTRAR ALTA
  ───────────────────────────────────────── */
  window.registrarAlta = function (nome, especialidade, dataInicio) {
    window._altaNome = nome;
    window._altaEspecialidade = especialidade;
    window._altaDataInicio = dataInicio;

    const modal = document.getElementById('modalAlta');
    const titulo = document.getElementById('tituloModalAlta');
    const detalhes = document.getElementById('detalhesAlta');
    const dataAltaInput = document.getElementById('dataAlta');
    const obsInput = document.getElementById('obsAlta');
    const erroEl = document.getElementById('erroAlta');

    if (titulo) titulo.textContent = 'Registrar Alta — ' + nome;
    if (detalhes) {
      detalhes.innerHTML = '<strong>' + escaparHtml(nome) + '</strong> &bull; ' + escaparHtml(especialidade) + '<br><small>Início do atendimento: ' + escaparHtml(dataInicio) + '</small>';
    }
    if (obsInput) obsInput.value = '';
    if (erroEl) erroEl.style.display = 'none';

    if (dataAltaInput) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      dataAltaInput.value = ano + '-' + mes + '-' + dia;
    }

    if (modal) modal.classList.add('visivel');
  };

  window.fecharModalAlta = function () {
    const modal = document.getElementById('modalAlta');
    if (modal) modal.classList.remove('visivel');
    const erroEl = document.getElementById('erroAlta');
    if (erroEl) erroEl.style.display = 'none';
  };

  window.confirmarAlta = function () {
    const dataAltaInput = document.getElementById('dataAlta');
    const erroEl = document.getElementById('erroAlta');
    const dataAltaVal = dataAltaInput ? dataAltaInput.value : '';

    if (!dataAltaVal) {
      if (erroEl) {
        erroEl.textContent = 'Informe a data de alta.';
        erroEl.style.display = 'block';
      }
      return;
    }

    const dtInicio = parseData(window._altaDataInicio);
    const dtAlta = parseData(dataAltaVal);

    if (dtInicio && dtAlta && dtAlta < dtInicio) {
      if (erroEl) {
        erroEl.textContent = 'A data de alta não pode ser anterior à data de início (' + window._altaDataInicio + ').';
        erroEl.style.display = 'block';
      }
      return;
    }

    if (erroEl) erroEl.style.display = 'none';

    // Localiza a linha correspondente no tbody
    const linhas = document.querySelectorAll('#corpoAtendimentos tr');
    linhas.forEach(function (linha) {
      const nomeLinha = linha.getAttribute('data-nome');
      const especLinha = linha.getAttribute('data-especialidade');
      const situacao = linha.getAttribute('data-situacao');

      if (nomeLinha === window._altaNome && especLinha === window._altaEspecialidade && situacao === 'ativo') {
        linha.setAttribute('data-situacao', 'encerrado');

        const badge = linha.querySelector('.badge-status');
        if (badge) {
          badge.className = 'badge-status badge-encerrado';
          badge.textContent = 'Encerrado';
        }

        const btnAlta = linha.querySelector('.btn-registrar-alta');
        if (btnAlta) {
          btnAlta.remove();
        }
      }
    });

    // (aqui reside o django) -> Salva a Alta tb no BD Python/Django (tabela Acompanhamento do Luiz!)
    const obsInput = document.getElementById('obsAlta');
    fetch(((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/atendimentos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'alta',
        pessoa: window._altaNome,
        especialidade: window._altaEspecialidade,
        data_alta: dataAltaVal,
        observacoes: obsInput ? obsInput.value.trim() : ''
      })
    }).catch(function () {});

    atualizarContadoresAbas();
    fecharModalAlta();
    mostrarToast('toastAtendimentos', 'Alta registrada no Banco para ' + window._altaNome);

    // Reaplica filtro ativo para ajustar a exibição
    const tabAtiva = document.querySelector('.tab-atend.ativo');
    if (tabAtiva) {
      filtrarSituacao(tabAtiva.getAttribute('data-tab') || 'ativo', null);
    }
  };

  /* ─────────────────────────────────────────
     4. ATUALIZAR CONTADORES DAS ABAS
  ───────────────────────────────────────── */
  function atualizarContadoresAbas() {
    const linhas = document.querySelectorAll('#corpoAtendimentos tr');
    let ativos = 0;
    let encerrados = 0;
    let cancelados = 0;

    linhas.forEach(function (linha) {
      const sit = linha.getAttribute('data-situacao');
      if (sit === 'ativo') ativos++;
      else if (sit === 'encerrado') encerrados++;
      else if (sit === 'cancelado') cancelados++;
    });

    const total = linhas.length;

    const btnAtivo = document.querySelector('.tab-atend[data-tab="ativo"]');
    if (btnAtivo) btnAtivo.textContent = 'Ativos (' + ativos + ')';

    const btnEncerrado = document.querySelector('.tab-atend[data-tab="encerrado"]');
    if (btnEncerrado) btnEncerrado.textContent = 'Encerrados (' + encerrados + ')';

    const btnCancelado = document.querySelector('.tab-atend[data-tab="cancelado"]');
    if (btnCancelado) btnCancelado.textContent = 'Cancelados (' + cancelados + ')';

    const btnTodos = document.querySelector('.tab-atend[data-tab="todos"]');
    if (btnTodos) btnTodos.textContent = 'Todos (' + total + ')';
  }

  /* ─────────────────────────────────────────
     5. TOAST REUTILIZÁVEL
  ───────────────────────────────────────── */
  window.mostrarToast = function (id, mensagem) {
    let toast = null;
    let texto = mensagem;

    if (id && document.getElementById(id)) {
      toast = document.getElementById(id);
    } else {
      toast = document.querySelector('.toast-sucesso');
      if (!mensagem && id) texto = id;
    }

    if (!toast) return;

    toast.textContent = texto || 'Ação realizada com sucesso!';
    toast.classList.add('visivel');
    setTimeout(function () {
      toast.classList.remove('visivel');
    }, 3200);
  };

  /* ─────────────────────────────────────────
     6. FECHAR MODAIS CLICANDO FORA OU COM ESC
  ───────────────────────────────────────── */
  document.querySelectorAll('.modal-aviso').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        if (modal.id === 'modalNovoAtend') fecharNovoAtendimento();
        if (modal.id === 'modalAlta') fecharModalAlta();
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      fecharNovoAtendimento();
      fecharModalAlta();
    }
  });

  /* ─────────────────────────────────────────
     7. INICIALIZAÇÃO + INTEGRAÇÃO BD PYTHON
  ───────────────────────────────────────── */
  atualizarContadoresAbas();
  // Exibe inicialmente os atendimentos ativos conforme a aba ativa
  filtrarSituacao('ativo', document.querySelector('.tab-atend[data-tab="ativo"]'));

  // Puxa as pessoas cadastradas no BD Python p/ aparecerem no select de Novo Atendimento!
  fetch(((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/pessoas/')
    .then(function (r) { return r.json(); })
    .then(function (dados) {
      const selPessoa = document.getElementById('novoAtendPessoa');
      if (!selPessoa || !dados.pessoas) return;
      const existentes = Array.from(selPessoa.options).map(function (o) { return o.value.toLowerCase(); });
      dados.pessoas.forEach(function (p) {
        if (p.nome && existentes.indexOf(p.nome.toLowerCase()) === -1) {
          const opt = document.createElement('option');
          opt.value = p.nome;
          opt.textContent = p.nome;
          selPessoa.appendChild(opt);
        }
      });
    })
    .catch(function () {});

  /* ─────────────────────────────────────────
     UTILITÁRIOS
  ───────────────────────────────────────── */
  function parseData(str) {
    if (!str) return null;
    if (str.includes('/')) {
      const p = str.split('/');
      return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
    } else if (str.includes('-')) {
      const p = str.split('-');
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }
    return new Date(str);
  }

  function escaparHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escaparAttr(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

});
