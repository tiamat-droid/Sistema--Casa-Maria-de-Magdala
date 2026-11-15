/* especialidades.js — interações da tela de Especialidades (Django) */

// abre um modal pelo id
function abrirModal(id) {
  document.getElementById(id).classList.add('visivel');
}

// fecha todos os modais
function fecharModais() {
  document.querySelectorAll('.modal-esp').forEach(function (m) {
    m.classList.remove('visivel');
  });
}

// filtro por categoria (so mostra/esconde, n recarrega a pagina)
function filtrarCategoria(categoria, botao) {
  document.querySelectorAll('.btn-categoria').forEach(function (b) { b.classList.remove('ativo'); });
  botao.classList.add('ativo');
  document.querySelectorAll('.secao-categoria').forEach(function (s) {
    s.style.display = (categoria === 'todas' || s.dataset.grupo === categoria) ? '' : 'none';
  });
}

// preenche o modal de edicao com os dados do card clicado
function abrirEdicao(btn) {
  document.getElementById('formEditar').action = '/especialidades/' + btn.dataset.id + '/editar/';
  document.getElementById('editNome').value = btn.dataset.nome;
  document.getElementById('editCategoria').value = btn.dataset.categoria;
  document.getElementById('editAtiva').checked = btn.dataset.ativa === '1';
  abrirModal('modalEditar');
}

// confirma a exclusao (o POST vai pro Django apagar de vdd no BD)
function abrirExclusao(btn) {
  document.getElementById('formExcluir').action = '/especialidades/' + btn.dataset.id + '/excluir/';
  document.getElementById('excluirNome').textContent = btn.dataset.nome;
  abrirModal('modalExcluir');
}

// clicar fora do modal ou apertar Esc fecha
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-esp')) fecharModais();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') fecharModais();
});
