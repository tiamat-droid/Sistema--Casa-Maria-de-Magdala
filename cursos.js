// cursos.js – Módulo Cursos e Capacitações
// c/ comentários informais p/ facilitar o entendimento ;)

document.addEventListener('DOMContentLoaded', function () {

  // Guarda referência ao card q está sendo editado (null = novo curso)
  var cardEmEdicao = null;

  // ── Filtrar Cursos ───────────────────────────────────────────
  window.filtrarCursos = function (status, btn) {
    document.querySelectorAll('.btn-filtro-curso').forEach(function (b) {
      b.classList.remove('ativo');
    });
    btn.classList.add('ativo');

    document.querySelectorAll('.card-curso').forEach(function (card) {
      card.style.display = (status === 'todos' || card.dataset.status === status) ? '' : 'none';
    });
  };

  // ── Modal Novo Curso ─────────────────────────────────────────
  window.abrirModalNovoCurso = function () {
    cardEmEdicao = null;
    limparFormularioCurso();
    var modal = document.getElementById('modalNovoCurso');
    if (modal) {
      var h2 = modal.querySelector('h2, h3');
      if (h2) h2.textContent = 'Novo Curso / Oficina';
      modal.classList.add('visivel');
      document.getElementById('cursoNome').focus();
    }
  };

  window.fecharModalNovoCurso = function () {
    cardEmEdicao = null;
    var modal = document.getElementById('modalNovoCurso');
    if (modal) {
      modal.classList.remove('visivel');
      limparFormularioCurso();
    }
  };

  var modalNovoCurso = document.getElementById('modalNovoCurso');
  if (modalNovoCurso) {
    modalNovoCurso.addEventListener('click', function (e) {
      if (e.target === modalNovoCurso) fecharModalNovoCurso();
    });
  }

  // ── Salvar Curso (Novo ou Edição) ────────────────────────────
  window.salvarNovoCurso = function () {
    var nome = document.getElementById('cursoNome').value.trim();
    if (!nome) {
      document.getElementById('cursoNome').focus();
      document.getElementById('cursoNome').style.borderColor = '#ef4444';
      return;
    }
    document.getElementById('cursoNome').style.borderColor = '';

    var categoria = document.getElementById('cursoCategoria').value;
    var diasHorario = document.getElementById('cursoDiasHorario').value.trim();
    var profissional = document.getElementById('cursoProfissional').value.trim();
    var status = document.getElementById('cursoStatus').value;

    var novoCard = criarCardCurso({
      nome: nome,
      categoria: categoria,
      diasHorario: diasHorario,
      profissional: profissional,
      status: status
    });

    if (cardEmEdicao) {
      // Substitui o card antigo pelo editado mantendo na mesma posição
      cardEmEdicao.replaceWith(novoCard);
      fecharModalNovoCurso();
      mostrarToast('✅ Curso "' + nome + '" atualizado com sucesso!');
      if (window.salvarEstadoPagina) window.salvarEstadoPagina();
      return;
    }

    var grade = document.getElementById('gradeCursos') || document.querySelector('.grade-cursos');
    if (grade) {
      grade.appendChild(novoCard);
    }

    fecharModalNovoCurso();
    mostrarToast('✅ Curso "' + nome + '" adicionado com sucesso!');
    if (window.salvarEstadoPagina) window.salvarEstadoPagina();
  };

  // ── Criar Card ───────────────────────────────────────────────
  function criarCardCurso(dados) {
    var card = document.createElement('div');
    card.className = 'card-curso';
    card.dataset.status = dados.status;

    var categoriasLabel = {
      artesanato: 'Artesanato',
      capacitacao: 'Capacitação',
      educacao: 'Educação',
      cultura: 'Cultura e Arte'
    };
    var categoriasClasse = {
      artesanato: 'badge-artesanato',
      capacitacao: 'badge-capacitacao',
      educacao: 'badge-educacao',
      cultura: 'badge-cultura'
    };
    var statusLabel = {
      ativo: 'Ativo',
      aguardando: 'Aguardando Horário',
      encerrado: 'Encerrado'
    };
    var statusClasse = {
      ativo: 'badge-ativo',
      aguardando: 'badge-aguardando',
      encerrado: 'badge-encerrado'
    };

    var profHtml = dados.profissional
      ? '<p class="card-curso-profissional">👤 ' + dados.profissional + '</p>'
      : '<p class="card-curso-profissional">👤 Profissional a definir</p>';

    var horarioHtml = dados.diasHorario
      ? '<p class="card-curso-horario">📅 ' + dados.diasHorario + '</p>'
      : '';

    card.innerHTML =
      '<div class="card-curso-topo">' +
        '<span class="card-curso-nome">' + dados.nome + '</span>' +
        '<span class="badge-categoria ' + (categoriasClasse[dados.categoria] || '') + '">' + (categoriasLabel[dados.categoria] || dados.categoria) + '</span>' +
      '</div>' +
      horarioHtml +
      profHtml +
      '<div class="card-curso-rodape">' +
        '<span class="badge-status-curso ' + (statusClasse[dados.status] || '') + '">' + (statusLabel[dados.status] || dados.status) + '</span>' +
        '<button class="botao-editar" onclick="editarCurso(this)">Editar</button>' +
      '</div>';

    return card;
  }

  // ── Editar Curso Real (abre o modal c/ os dados preenchidos!) ──
  window.editarCurso = function (btn) {
    var card = btn.closest('.card-curso');
    if (!card) return;
    cardEmEdicao = card;

    var nome = (card.querySelector('.card-curso-nome') || {}).textContent || '';
    var catTexto = (card.querySelector('.badge-categoria') || {}).textContent || '';
    var horarioEl = card.querySelector('.card-curso-horario');
    var profEl = card.querySelector('.card-curso-profissional');
    var status = card.dataset.status || 'ativo';

    var horario = horarioEl ? horarioEl.textContent.replace('📅', '').trim() : '';
    var prof = profEl ? profEl.textContent.replace('👤', '').trim() : '';
    if (prof === 'Profissional a definir') prof = '';

    document.getElementById('cursoNome').value = nome.trim();
    document.getElementById('cursoDiasHorario').value = horario;
    document.getElementById('cursoProfissional').value = prof;
    document.getElementById('cursoStatus').value = status;

    var selCat = document.getElementById('cursoCategoria');
    if (selCat) {
      Array.from(selCat.options).forEach(function (opt, i) {
        if (opt.textContent.trim().toLowerCase() === catTexto.trim().toLowerCase()) {
          selCat.selectedIndex = i;
        }
      });
    }

    var modal = document.getElementById('modalNovoCurso');
    if (modal) {
      var h2 = modal.querySelector('h2, h3');
      if (h2) h2.textContent = 'Editar Curso';
      modal.classList.add('visivel');
      document.getElementById('cursoNome').focus();
    }
  };

  function limparFormularioCurso() {
    document.getElementById('cursoNome').value = '';
    document.getElementById('cursoCategoria').selectedIndex = 0;
    document.getElementById('cursoDiasHorario').value = '';
    document.getElementById('cursoProfissional').value = '';
    document.getElementById('cursoStatus').selectedIndex = 0;
  }

  function mostrarToast(msg) {
    var toast = document.getElementById('toast-curso');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.display = 'none';
    }, 3200);
  }

});
