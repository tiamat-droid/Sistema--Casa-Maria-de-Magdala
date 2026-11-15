/* ========================================================
   COMPORTAMENTOS E INTERATIBILIDADE: PAINEL PRINCIPAL (sistema.js)
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const inputFiltro = document.getElementById('filtroModulos');
    const cards = document.querySelectorAll('.card-modulo');
    const contador = document.getElementById('contadorModulos');
    const avisoVazio = document.getElementById('buscaVazia');

    // 1. Filtro dinâmico em tempo real dos 10 módulos
    if (inputFiltro) {
        inputFiltro.addEventListener('input', function () {
            const termo = this.value.toLowerCase().trim();
            let visiveis = 0;

            cards.forEach(card => {
                const buscaTexto = (card.getAttribute('data-busca') || '') + ' ' + card.innerText.toLowerCase();
                if (buscaTexto.includes(termo)) {
                    card.style.display = 'flex';
                    visiveis++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (visiveis === 0) {
                if (avisoVazio) avisoVazio.style.display = 'block';
                if (contador) contador.textContent = '0 módulos encontrados';
            } else {
                if (avisoVazio) avisoVazio.style.display = 'none';
                if (contador) contador.textContent = visiveis + (visiveis === 1 ? ' módulo encontrado' : ' módulos disponíveis');
            }
        });
    }

    window.limparBusca = function () {
        if (inputFiltro) {
            inputFiltro.value = '';
            inputFiltro.dispatchEvent(new Event('input'));
            inputFiltro.focus();
        }
    };

    // 2. Modal de informação amigável para módulos em construção
    window.mostrarAviso = function (mensagem) {
        const msgEl = document.getElementById('modalMensagem');
        const modal = document.getElementById('modalAviso');
        if (msgEl) msgEl.textContent = mensagem;
        if (modal) modal.classList.add('visivel');
    };

    window.fecharAviso = function () {
        const modal = document.getElementById('modalAviso');
        if (modal) modal.classList.remove('visivel');
    };

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function (e) {
        const modal = document.getElementById('modalAviso');
        if (e.target === modal) {
            fecharAviso();
        }
    });
});
