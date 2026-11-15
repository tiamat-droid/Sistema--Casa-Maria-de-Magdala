// dashboard.js – Módulo Dashboard (Conectado ao Python / Django!)
// c/ comentários informais p/ facilitar o entendimento ;)

document.addEventListener('DOMContentLoaded', function () {

  // (aqui reside o django) -> rota do Django p/ buscar resumo dos indicadores no banco
  var API_RESUMO = ((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/resumo/';

  // ── Cronograma Real por Dia da Semana ────────────────────────
  var cronogramaSemanal = {
    0: { nome: 'Domingo', atividades: [] },
    1: {
      nome: 'Segunda-feira',
      atividades: [
        { horario: '08:00 – 12:00', especialidade: 'Fonoaudiologia', profissional: 'Mara' },
        { horario: '09:00 – 11:00', especialidade: 'Pintura em Tecido', profissional: 'Mª Helena' },
        { horario: '13:00 – 17:00', especialidade: 'Fisioterapia Médica', profissional: 'Cristina' }
      ]
    },
    2: {
      nome: 'Terça-feira',
      atividades: [
        { horario: '08:00 – 17:00', especialidade: 'Fisioterapia Médica', profissional: 'Cristina' },
        { horario: '08:00 – 17:00', especialidade: 'Fonoaudiologia', profissional: 'Mara' }
      ]
    },
    3: {
      nome: 'Quarta-feira',
      atividades: [
        { horario: '08:00 – 12:00', especialidade: 'Fonoaudiologia', profissional: 'Mara' },
        { horario: '08:30 – 13:30', especialidade: 'Fisioterapia Médica', profissional: 'Cristina' },
        { horario: '09:00 – 11:00', especialidade: 'Pintura em Tecido', profissional: 'Maria Helena' },
        { horario: '09:00 – 11:00', especialidade: 'Crochê', profissional: 'Wanda' },
        { horario: '09:00 – 16:00', especialidade: 'Psicologia', profissional: 'Valéria' },
        { horario: '13:00 – 16:00', especialidade: 'Psicologia', profissional: 'Ana Maria' },
        { horario: '13:00 – 16:00', especialidade: 'Fisioterapia Pediátrica', profissional: 'João' },
        { horario: '13:30 – 16:30', especialidade: 'Assistência Jurídica', profissional: 'Dra. Elvira' },
        { horario: '14:00 – 17:00', especialidade: 'Massagem Terapêutica', profissional: 'Telma' }
      ]
    },
    4: {
      nome: 'Quinta-feira',
      atividades: [
        { horario: '08:00 – 17:00', especialidade: 'Fisioterapia Médica', profissional: 'Cristina' },
        { horario: '09:00 – 12:00', especialidade: 'Acupuntura', profissional: 'Alessandra' },
        { horario: '09:00 – 16:00', especialidade: 'Nutrição', profissional: 'Bruna' }
      ]
    },
    5: {
      nome: 'Sexta-feira',
      atividades: [
        { horario: '08:30 – 11:30', especialidade: 'Reflexologia / Reiki', profissional: 'A definir' },
        { horario: '08:30 – 13:30', especialidade: 'Fisioterapia Médica', profissional: 'A definir' },
        { horario: '09:00 – 16:00', especialidade: 'Psicologia', profissional: 'Valéria' },
        { horario: '14:00 – 17:00', especialidade: 'Costura Criativa', profissional: 'Andréa' }
      ]
    },
    6: { nome: 'Sábado', atividades: [] }
  };

  window.carregarAgendaHoje = function () {
    var hoje = new Date().getDay();
    var dadosHoje = cronogramaSemanal[hoje] || { nome: 'Hoje', atividades: [] };

    var tagDia = document.getElementById('diaSemanaHoje');
    if (tagDia) tagDia.textContent = dadosHoje.nome;

    var container = document.getElementById('agendaHoje');
    if (!container) return;

    if (!dadosHoje.atividades || dadosHoje.atividades.length === 0) {
      container.innerHTML = '<div class="sem-atividades">🏖️ Sem atividades agendadas para hoje (' + dadosHoje.nome + ').</div>';
      return;
    }

    var html = '';
    dadosHoje.atividades.forEach(function (item) {
      var profTexto = item.profissional ? ('👤 ' + item.profissional) : '👤 A definir';
      html +=
        '<div class="item-agenda-hoje">' +
          '<div class="agenda-info">' +
            '<span class="agenda-horario">🕒 ' + item.horario + '</span>' +
            '<span class="agenda-especialidade">' + item.especialidade + '</span>' +
          '</div>' +
          '<span class="agenda-profissional">' + profTexto + '</span>' +
        '</div>';
    });

    container.innerHTML = html;
  };

  // Busca os totais reais do banco de dados no Python (/api/resumo/)!
  async function carregarIndicadoresDoBanco() {
    var contadores = document.querySelectorAll('.card-indicador .numero');
    var totalPessoas = 5;
    var atendAtivos = 4;
    var totalEsp = 20;

    try {
      var resp = await fetch(API_RESUMO);
      if (resp.ok) {
        var dados = await resp.json();
        totalPessoas = dados.total_pessoas;
        atendAtivos = dados.pessoas_ativas;
        totalEsp = dados.total_especialidades || 20;
      }
    } catch (err) {
      // Se offline, tenta contar do localStorage
      try {
        var salvo = JSON.parse(localStorage.getItem('magdala_pessoas_v1') || '[]');
        if (salvo.length) {
          totalPessoas = salvo.length;
          atendAtivos = salvo.filter(function (p) { return p.status === 'ativa'; }).length;
        }
      } catch (e) {}
    }

    if (contadores[0]) contadores[0].setAttribute('data-valor', totalPessoas);
    if (contadores[1]) contadores[1].setAttribute('data-valor', atendAtivos);
    if (contadores[2]) contadores[2].setAttribute('data-valor', totalEsp);
    if (contadores[3]) contadores[3].setAttribute('data-valor', 12);

    window.animarContadores();
  }

  window.animarContadores = function () {
    var duracao = 300;
    var contadores = document.querySelectorAll('.card-indicador .numero');

    contadores.forEach(function (el) {
      var final = parseInt(el.getAttribute('data-valor'), 10) || 0;
      if (final === 0) {
        el.textContent = '0';
        return;
      }

      var inicio = 0;
      var tempoInicio = null;

      function step(timestamp) {
        if (!tempoInicio) tempoInicio = timestamp;
        var progresso = Math.min((timestamp - tempoInicio) / duracao, 1);
        var valorAtual = Math.floor(progresso * (final - inicio) + inicio);
        el.textContent = valorAtual;

        if (progresso < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = final;
        }
      }

      window.requestAnimationFrame(step);
    });
  };

  window.carregarAgendaHoje();
  carregarIndicadoresDoBanco();
});
