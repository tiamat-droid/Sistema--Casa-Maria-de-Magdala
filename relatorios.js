// relatorios.js — Módulo Relatórios e Consultas (Conectado ao Python / Django!)
// c/ comentários informais p/ facilitar o entendimento ;)

document.addEventListener('DOMContentLoaded', function () {

  // (aqui reside o django) -> rota do Django p/ gerar relatórios em JSON e baixar CSV real
  var API_RELATORIOS       = ((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/relatorios/';
  var painelFiltros        = document.getElementById('painelFiltros');
  var tituloPainel         = document.getElementById('tituloPainel');
  var filtrosPeriodo       = document.getElementById('filtrosPeriodo');
  var filtrosEspecialidade = document.getElementById('filtrosEspecialidade');
  var selectEspecialidade  = document.getElementById('selectEspecialidade');
  var inputDataInicio      = document.getElementById('dataInicio');
  var inputDataFim         = document.getElementById('dataFim');
  var tabelaPrevia         = document.getElementById('tabelaPrevia');
  var trPrevia             = document.getElementById('trPrevia');
  var tbodyPrevia          = document.getElementById('tbodyPrevia');
  var toastEl              = document.getElementById('toastSucesso');
  var cardAtual            = 'Pessoas por Especialidade';

  function mostrarToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('visivel');
    setTimeout(function () { toastEl.classList.remove('visivel'); }, 3200);
  }

  // Monta os parâmetros de filtro atuais p/ enviar pro Python
  function montarQueryParams(formato) {
    var espTexto = '';
    if (selectEspecialidade && selectEspecialidade.value) {
      espTexto = selectEspecialidade.options[selectEspecialidade.selectedIndex].text.trim();
    }
    var params = new URLSearchParams({
      tipo: cardAtual || 'Pessoas por Especialidade',
      especialidade: espTexto,
      data_inicio: inputDataInicio ? inputDataInicio.value : '',
      data_fim: inputDataFim ? inputDataFim.value : '',
      formato: formato || 'json'
    });
    return params.toString();
  }

  // Busca os dados no Python (/api/relatorios/) e desenha a tabela na tela!
  window.carregarPreviaRelatorio = async function () {
    var caption = tabelaPrevia ? tabelaPrevia.querySelector('caption') : null;
    if (caption) caption.textContent = 'Consultando banco de dados via Python/Django...';

    try {
      var resp = await fetch(API_RELATORIOS + '?' + montarQueryParams('json'));
      if (!resp.ok) throw new Error('offline');
      var dados = await resp.json();

      if (caption) {
        caption.innerHTML = '<strong>' + dados.tipo + '</strong> — ' + dados.total_registros + ' registro(s) encontrado(s) • Gerado via Python em ' + dados.gerado_em;
      }

      // Monta o cabeçalho <thead>
      trPrevia.innerHTML = (dados.colunas || []).map(function (col) {
        return '<th>' + col + '</th>';
      }).join('');

      // Monta as linhas <tbody>
      if (!dados.linhas || dados.linhas.length === 0) {
        tbodyPrevia.innerHTML = '<tr><td colspan="' + (dados.colunas.length || 4) + '" style="text-align:center; padding:20px; color:#64748b;">Nenhum registro encontrado para esse filtro.</td></tr>';
      } else {
        tbodyPrevia.innerHTML = dados.linhas.map(function (linha) {
          return '<tr>' + linha.map(function (celula) {
            return '<td>' + celula + '</td>';
          }).join('') + '</tr>';
        }).join('');
      }
    } catch (err) {
      if (caption) caption.textContent = 'Servidor Django desligado. Ligue o manage.py runserver para consultar o banco.';
    }
  };

  // Abre o painel de filtros e já carrega o relatório escolhido!
  window.abrirFiltros = function (nomeRelatorio) {
    document.querySelectorAll('.card-relatorio').forEach(function (c) {
      c.classList.remove('selecionado');
    });

    var mapa = {
      'Pessoas por Especialidade': 'card-pessoas',
      'Atendimentos por Período':  'card-atendimentos',
      'Profissionais e Agenda':    'card-profissionais',
      'Cursos e Capacitações':     'card-cursos'
    };
    var idCard = mapa[nomeRelatorio];
    if (idCard && document.getElementById(idCard)) {
      document.getElementById(idCard).classList.add('selecionado');
    }
    cardAtual = nomeRelatorio;
    tituloPainel.textContent = 'Filtros — ' + nomeRelatorio;

    if (nomeRelatorio === 'Atendimentos por Período') {
      filtrosPeriodo.classList.remove('escondido');
      filtrosEspecialidade.classList.add('escondido');
    } else {
      filtrosPeriodo.classList.add('escondido');
      filtrosEspecialidade.classList.remove('escondido');
    }

    painelFiltros.classList.add('visivel');
    window.carregarPreviaRelatorio();
  };

  // Atualiza a tabela automaticamente qdo muda o select ou as datas
  if (selectEspecialidade) selectEspecialidade.addEventListener('change', window.carregarPreviaRelatorio);
  if (inputDataInicio) inputDataInicio.addEventListener('change', window.carregarPreviaRelatorio);
  if (inputDataFim) inputDataFim.addEventListener('change', window.carregarPreviaRelatorio);

  window.fecharFiltros = function () {
    painelFiltros.classList.remove('visivel');
    document.querySelectorAll('.card-relatorio').forEach(function (c) {
      c.classList.remove('selecionado');
    });
  };

  // Baixa o arquivo .csv gerado em Python (import csv no Django)!
  window.exportarCSV = function () {
    if (!cardAtual) cardAtual = 'Pessoas por Especialidade';
    var urlDownload = API_RELATORIOS + '?' + montarQueryParams('csv');
    window.open(urlDownload, '_blank');
    mostrarToast('📥 Planilha CSV de "' + cardAtual + '" gerada pelo Python!');
  };

  // Abre a janela de impressão / salvar como PDF
  window.imprimirRelatorio = function () {
    window.print();
  };

  // Já carrega o 1º relatório assim q abre a tela p/ tabela não ficar vazia!
  window.abrirFiltros('Pessoas por Especialidade');
});
