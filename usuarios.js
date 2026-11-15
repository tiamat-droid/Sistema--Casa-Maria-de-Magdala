// usuarios.js — Módulo Usuários do Sistema
// c/ comentários informais p/ facilitar o entendimento ;)

document.addEventListener('DOMContentLoaded', function () {

  var buscaInput     = document.getElementById('buscaUsuario');
  var tbody          = document.getElementById('tbodyUsuarios');
  var modal          = document.getElementById('modalNovoUsuario');
  var toastEl        = document.getElementById('toastSucesso');

  var inputNome      = document.getElementById('novoNome');
  var inputEmail     = document.getElementById('novoEmail');
  var selectPerfil   = document.getElementById('novoPerfil');
  var inputSenha     = document.getElementById('novaSenha');
  var inputConfSenha = document.getElementById('confirmarSenha');

  // Guarda a linha <tr> q está sendo editada (null = novo usuário)
  var linhaEmEdicao  = null;

  function mostrarToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('visivel');
    setTimeout(function () { toastEl.classList.remove('visivel'); }, 3200);
  }

  window.filtrarUsuarios = function () {
    var termo = (buscaInput.value || '').toLowerCase().trim();
    var linhas = tbody.getElementsByTagName('tr');

    for (var i = 0; i < linhas.length; i++) {
      var tr = linhas[i];
      var nome = tr.getAttribute('data-nome') || tr.cells[0].textContent;
      var email = tr.getAttribute('data-email') || tr.cells[1].textContent;
      var textoCompleto = (nome + ' ' + email).toLowerCase();
      tr.style.display = (!termo || textoCompleto.indexOf(termo) > -1) ? '' : 'none';
    }
  };

  window.abrirModalNovoUsuario = function () {
    linhaEmEdicao = null;
    inputNome.value = '';
    inputEmail.value = '';
    selectPerfil.value = 'Administrador';
    inputSenha.value = '';
    inputConfSenha.value = '';
    var h2 = modal.querySelector('h2, h3');
    if (h2) h2.textContent = 'Novo Usuário';
    modal.classList.add('visivel');
    inputNome.focus();
  };

  window.fecharModalNovoUsuario = function () {
    linhaEmEdicao = null;
    modal.classList.remove('visivel');
  };

  modal.addEventListener('click', function (e) {
    if (e.target === modal) window.fecharModalNovoUsuario();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('visivel')) {
      window.fecharModalNovoUsuario();
    }
  });

  // ── Salvar Usuário (Novo ou Edição) ──────────────────────────
  window.salvarUsuario = function () {
    var nome = (inputNome.value || '').trim();
    var email = (inputEmail.value || '').trim();
    var perfil = selectPerfil.value;
    var senha = inputSenha.value;
    var confSenha = inputConfSenha.value;

    if (!nome) { alert('Por favor, informe o nome do usuário.'); inputNome.focus(); return; }
    if (!email) { alert('Por favor, informe o e-mail do usuário.'); inputEmail.focus(); return; }

    // Na edição a senha é opcional (só valida se digitar algo)
    if (!linhaEmEdicao && !senha) {
      alert('Por favor, defina uma senha para o usuário.');
      inputSenha.focus();
      return;
    }
    if (senha && senha !== confSenha) {
      alert('As senhas não coincidem!');
      inputConfSenha.focus();
      return;
    }

    var perfilClassMap = {
      'Administrador': 'badge-administrador',
      'Coordenador':   'badge-coordenador',
      'Recepcionista': 'badge-recepcionista',
      'Visualizador':  'badge-visualizador'
    };
    var perfilClass = perfilClassMap[perfil] || 'badge-visualizador';

    if (linhaEmEdicao) {
      linhaEmEdicao.setAttribute('data-nome', nome);
      linhaEmEdicao.setAttribute('data-email', email);
      linhaEmEdicao.cells[0].textContent = nome;
      linhaEmEdicao.cells[1].textContent = email;
      linhaEmEdicao.cells[2].innerHTML = '<span class="badge-perfil ' + perfilClass + '">' + escapeHtml(perfil) + '</span>';
      var btnEdit = linhaEmEdicao.querySelector('.btn-acao');
      if (btnEdit) btnEdit.setAttribute('onclick', "window.editarUsuario('" + escapeJs(nome) + "', this)");

      window.fecharModalNovoUsuario();
      mostrarToast('Usuário "' + nome + '" atualizado com sucesso!');
      if (window.salvarEstadoPagina) window.salvarEstadoPagina();
      return;
    }

    var tr = document.createElement('tr');
    tr.setAttribute('data-nome', nome);
    tr.setAttribute('data-email', email);

    tr.innerHTML =
      '<td>' + escapeHtml(nome) + '</td>' +
      '<td>' + escapeHtml(email) + '</td>' +
      '<td><span class="badge-perfil ' + perfilClass + '">' + escapeHtml(perfil) + '</span></td>' +
      '<td><span class="badge-ativo">Ativo</span></td>' +
      '<td class="td-acoes">' +
        '<button class="btn-acao" onclick="window.editarUsuario(\'' + escapeJs(nome) + '\', this)">Editar</button>' +
      '</td>';

    tbody.appendChild(tr);

    window.fecharModalNovoUsuario();
    mostrarToast('Usuário "' + nome + '" cadastrado com sucesso!');
    if (window.salvarEstadoPagina) window.salvarEstadoPagina();
  };

  // ── Editar Usuário Real (preenche o modal c/ os dados da linha!) ──
  window.editarUsuario = function (nome, btnEl) {
    var tr = btnEl ? btnEl.closest('tr') : null;
    if (!tr) {
      var linhas = tbody.getElementsByTagName('tr');
      for (var i = 0; i < linhas.length; i++) {
        if ((linhas[i].getAttribute('data-nome') || linhas[i].cells[0].textContent.trim()) === nome) {
          tr = linhas[i];
          break;
        }
      }
    }
    if (!tr) return;

    linhaEmEdicao = tr;
    inputNome.value = tr.cells[0].textContent.trim();
    inputEmail.value = tr.cells[1].textContent.trim();
    selectPerfil.value = tr.cells[2].textContent.trim();
    inputSenha.value = '';
    inputConfSenha.value = '';

    var h2 = modal.querySelector('h2, h3');
    if (h2) h2.textContent = 'Editar Usuário';
    modal.classList.add('visivel');
    inputNome.focus();
  };

  window.reativarUsuario = function (nome) {
    var linhas = tbody.getElementsByTagName('tr');
    for (var i = 0; i < linhas.length; i++) {
      var tr = linhas[i];
      if (tr.getAttribute('data-nome') === nome) {
        tr.cells[3].innerHTML = '<span class="badge-ativo">Ativo</span>';
        tr.cells[4].innerHTML = '<button class="btn-acao" onclick="window.editarUsuario(\'' + escapeJs(nome) + '\', this)">Editar</button>';
        break;
      }
    }
    mostrarToast('Usuário "' + nome + '" reativado com sucesso!');
    if (window.salvarEstadoPagina) window.salvarEstadoPagina();
  };

  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  function escapeJs(texto) {
    return texto.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

});
