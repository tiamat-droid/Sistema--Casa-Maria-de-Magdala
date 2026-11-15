/* =====================================================
   excluir.js — Exclusão + Salvamento Automático (localStorage)
   c/ comentários informais p/ facilitar o entendimento ;)
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // Identifica qual página está aberta p/ salvar separado cada módulo (funciona em arquivo local e no Django!)
  var partesUrl = window.location.pathname.split('/').filter(Boolean);
  var paginaAtual = (partesUrl[partesUrl.length - 1] || 'pagina').replace('.html', '');
  var CHAVE_PAGINA = 'magdala_html_' + paginaAtual + '_v1';

  // Containers principais de cada tela (exceto pessoas.html q já tem seu próprio storage completo)
  var SELETOR_CONTAINERS = '.secao-categoria .grade-especialidades, #corpoProfissionais, #tabelaAtendimentos tbody, .grade-cursos, #tabelaUsuarios tbody, .grade-semanal';

  // 1. Restaura alterações salvas anteriormente nesta página (se houver)
  if (paginaAtual !== 'pessoas') {
    var dadosSalvos = localStorage.getItem(CHAVE_PAGINA);
    if (dadosSalvos) {
      try {
        var listaHtml = JSON.parse(dadosSalvos);
        var containers = document.querySelectorAll(SELETOR_CONTAINERS);
        if (containers.length === listaHtml.length) {
          containers.forEach(function (c, i) {
            c.innerHTML = listaHtml[i];
          });
        }
      } catch (err) {
        // se der erro no JSON, ignora e mantém o original
      }
    }
  }

  // Função q grava o estado atual da tela no navegador (localStorage)
  window.salvarEstadoPagina = function () {
    if (paginaAtual === 'pessoas') return;
    var containers = document.querySelectorAll(SELETOR_CONTAINERS);
    if (!containers.length) return;
    var estado = [];
    containers.forEach(function (c) {
      estado.push(c.innerHTML);
    });
    localStorage.setItem(CHAVE_PAGINA, JSON.stringify(estado));
  };

  var ITENS = 'main table tbody tr, .card-especialidade, .card-curso';

  function nomeDoItem(item) {
    var el = item.querySelector('.esp-nome, .card-curso-nome, .curso-nome, h3, strong, td');
    return el ? el.textContent.trim() : 'este item';
  }

  // Adiciona o btn de lixeira 🗑️ onde ainda n tiver
  function adicionarBotao(item) {
    if (item.querySelector('.btn-excluir-item')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-excluir-item';
    btn.title = 'Excluir';
    btn.innerHTML = '🗑️';

    var destino;
    if (item.tagName === 'TR') {
      var tds = item.querySelectorAll('td');
      var ultima = tds[tds.length - 1];
      destino = ultima.querySelector('.acoes-tabela') || ultima;
    } else {
      destino = item.querySelector('.esp-acoes, .card-acoes, .curso-acoes, .card-curso-rodape') ||
                item.querySelector('.esp-rodape, .curso-rodape') || item;
    }
    destino.appendChild(btn);
  }

  function prepararTudo() {
    document.querySelectorAll(ITENS).forEach(adicionarBotao);
  }

  // 2. Clique no btn de excluir (funciona p/ tabelas e cards, exceto pessoas q já trata pelo ID)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-excluir-item');
    if (!btn) return;

    // Se o btn já tiver onclick próprio (como no pessoas.js), deixa o onclick dele rodar
    if (btn.getAttribute('onclick')) return;

    var item = btn.closest('tr, .card-especialidade, .card-curso');
    if (!item) return;

    if (confirm('Excluir "' + nomeDoItem(item) + '"? Essa ação removerá o item da lista.')) {
      item.remove();
      window.salvarEstadoPagina();
    }
  });

  // 3. Observa qdo a pessoa adiciona ou edita algo na tela e já salva automático!
  var timerSalvar = null;
  new MutationObserver(function () {
    prepararTudo();
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(window.salvarEstadoPagina, 150);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  prepararTudo();
});
