/* ========================================================
   MÓDULO DE PESSOAS (pessoas.js) — Conectado ao Django + BD!
   c/ comentários informais p/ facilitar o entendimento ;)
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const CHAVE_STORAGE = 'magdala_pessoas_v1';
    // (aqui reside o django) -> rota de Pessoas no Python/Django (/api/pessoas/)
    const API_URL = ((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/pessoas/';
    const inputBusca = document.getElementById('buscaPessoas');
    const tbody = document.querySelector('#tabelaPessoas tbody');
    const contadorLinhas = document.getElementById('contadorLinhas');
    let statusAtual = 'todos';
    let cachePessoas = [];

    // Lista inicial padrão (usada se abrir sem servidor na 1ª vez)
    const PESSOAS_PADRAO = [
        {
            id: 1,
            nome: 'Maria da Conceição Silva',
            cpf: '123.456.789-00',
            data_nascimento: '1978-05-14',
            estado_civil: 'Casado(a)',
            telefone: '(21) 98765-4321',
            endereco: 'Rua das Flores, 120 - Centro, Niterói',
            nome_responsavel: 'José Silva (Esposo)',
            data_entrada: '2024-02-10',
            origem_cadastro: 'presencial',
            atendimentos_resumo: '2 ativos',
            atendimentos_detalhe: 'Fisio, Psico',
            status: 'ativa'
        },
        {
            id: 2,
            nome: 'João Carlos Pereira',
            cpf: '234.567.890-11',
            data_nascimento: '1965-11-22',
            estado_civil: 'Solteiro(a)',
            telefone: '(21) 97654-3210',
            endereco: 'Av. Amaral Peixoto, 450 - Niterói',
            nome_responsavel: '',
            data_entrada: '2024-05-15',
            origem_cadastro: 'encaminhamento',
            atendimentos_resumo: '1 ativo',
            atendimentos_detalhe: 'Nutrição',
            status: 'ativa'
        },
        {
            id: 3,
            nome: 'Ana Paula dos Santos',
            cpf: '345.678.901-22',
            data_nascimento: '1989-03-08',
            estado_civil: 'Divorciado(a)',
            telefone: '(21) 96543-2109',
            endereco: 'Rua São João, 88 - São Gonçalo',
            nome_responsavel: 'Lucia dos Santos (Mãe)',
            data_entrada: '2023-01-04',
            origem_cadastro: 'presencial',
            atendimentos_resumo: '0 ativos',
            atendimentos_detalhe: 'Nenhum (Alta em 2024)',
            status: 'inativa'
        },
        {
            id: 4,
            nome: 'Carlos Eduardo Ribeiro',
            cpf: '456.789.012-33',
            data_nascimento: '1972-09-30',
            estado_civil: 'União estável',
            telefone: '(21) 95432-1098',
            endereco: 'Travessa Santa Clara, 15 - Niterói',
            nome_responsavel: 'Márcia Gomes',
            data_entrada: '2024-08-20',
            origem_cadastro: 'online',
            atendimentos_resumo: '3 ativos',
            atendimentos_detalhe: 'Fisio, Acupuntura, Costura',
            status: 'ativa'
        },
        {
            id: 5,
            nome: 'Francisca Helena Lima',
            cpf: '567.890.123-44',
            data_nascimento: '1958-12-01',
            estado_civil: 'Viúvo(a)',
            telefone: '(21) 94321-0987',
            endereco: 'Rua Visconde de Uruguai, 310 - Niterói',
            nome_responsavel: 'Roberto Lima (Filho)',
            data_entrada: '2024-09-12',
            origem_cadastro: 'presencial',
            atendimentos_resumo: '1 ativo',
            atendimentos_detalhe: 'Serviço Social',
            status: 'ativa'
        }
    ];

    function carregarLocal() {
        const salvo = localStorage.getItem(CHAVE_STORAGE);
        if (!salvo) {
            localStorage.setItem(CHAVE_STORAGE, JSON.stringify(PESSOAS_PADRAO));
            return PESSOAS_PADRAO;
        }
        try { return JSON.parse(salvo); } catch (e) { return PESSOAS_PADRAO; }
    }

    function salvarLocal(lista) {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
    }

    // (aqui reside o django) -> Busca as pessoas no Banco de Dados do Django (Python); se o servidor estiver desligado, usa localStorage
    async function sincronizarComBanco() {
        try {
            const resp = await fetch(API_URL);
            if (resp.ok) {
                const json = await resp.json();
                if (json.pessoas) {
                    cachePessoas = json.pessoas;
                    salvarLocal(cachePessoas);
                    renderizarTabela(cachePessoas);
                    return;
                }
            }
        } catch (err) {
            // Servidor Django offline -> usa localStorage normalmente
        }
        cachePessoas = carregarLocal();
        renderizarTabela(cachePessoas);
    }

    function formatarDataBR(dataISO) {
        if (!dataISO) return '-';
        if (dataISO.includes('/')) return dataISO;
        const partes = dataISO.split('-');
        return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataISO;
    }

    // Links compatíveis tanto abrindo direto na pasta qto pelo Django (/interface/...)
    function urlCadastro(id) {
        const noDjango = window.location.pathname.indexOf('/interface/') !== -1;
        const base = noDjango ? '/interface/cadastro/' : 'cadastro.html';
        return id ? `${base}?id=${encodeURIComponent(id)}` : base;
    }

    function renderizarTabela(lista) {
        if (!tbody) return;
        tbody.innerHTML = '';

        lista.forEach(p => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', p.status || 'ativa');
            tr.setAttribute('data-cpf', p.cpf || '');
            tr.setAttribute('data-id', p.id);

            const dataBR = formatarDataBR(p.data_entrada);
            const isAtiva = (p.status || 'ativa') === 'ativa';
            const badgeAtend = isAtiva
                ? `<span class="badge-atendimentos">${p.atendimentos_resumo || '1 ativo'}</span> ${p.atendimentos_detalhe ? '(' + p.atendimentos_detalhe + ')' : ''}`
                : `<span class="badge-atendimentos" style="background:#f1f5f9; color:#64748b;">0 ativos</span>`;

            const badgeStatus = isAtiva
                ? `<span class="badge-status status-ativo">● Ativa</span>`
                : `<span class="badge-status status-inativo">○ Inativa</span>`;

            tr.innerHTML = `
                <td>
                    <strong>${p.nome}</strong><br>
                    <span style="font-size: 12px; color: var(--texto-secundario);">Desde ${dataBR}${!isAtiva ? ' (Inativa)' : ''}</span>
                </td>
                <td>${p.cpf}</td>
                <td>${p.telefone}</td>
                <td>${badgeAtend}</td>
                <td>${badgeStatus}</td>
                <td style="text-align: right;">
                    <div class="acoes-tabela" style="justify-content: flex-end;">
                        <button type="button" class="btn-acao destaque" onclick="abrirFichaPorId('${p.id}')">Ver Ficha</button>
                        <a href="${urlCadastro(p.id)}" class="btn-acao">Editar</a>
                        <button type="button" class="btn-excluir-item" title="Excluir" onclick="excluirPessoaPorId('${p.id}')">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        filtrarTabela();
    }

    if (inputBusca) {
        inputBusca.addEventListener('input', filtrarTabela);
    }

    window.filtrarStatus = function (status, botao) {
        statusAtual = status;
        document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('ativo'));
        botao.classList.add('ativo');
        filtrarTabela();
    };

    function filtrarTabela() {
        const termo = inputBusca ? inputBusca.value.toLowerCase().trim() : '';
        const linhasAtuais = document.querySelectorAll('#tabelaPessoas tbody tr');
        let visiveis = 0;

        linhasAtuais.forEach(linha => {
            const textoLinha = linha.innerText.toLowerCase();
            const statusLinha = linha.getAttribute('data-status');

            const bateBusca = textoLinha.includes(termo);
            const bateStatus = (statusAtual === 'todos') || (statusLinha === statusAtual);

            if (bateBusca && bateStatus) {
                linha.style.display = '';
                visiveis++;
            } else {
                linha.style.display = 'none';
            }
        });

        if (contadorLinhas) {
            contadorLinhas.textContent = `Exibindo ${visiveis} pessoa${visiveis === 1 ? '' : 's'} cadastrada${visiveis === 1 ? '' : 's'}`;
        }
    }

    window.abrirFichaPorId = function (id) {
        const p = cachePessoas.find(item => String(item.id) === String(id));
        if (!p) return;

        document.getElementById('fichaNome').textContent = p.nome;
        document.getElementById('fichaCpf').textContent = p.cpf;
        document.getElementById('fichaTelefone').textContent = p.telefone;
        document.getElementById('fichaAtendimentos').textContent = p.atendimentos_detalhe || 'Acolhimento Inicial';
        document.getElementById('fichaData').textContent = formatarDataBR(p.data_entrada);

        const linkEditarModal = document.querySelector('#modalFicha a.btn-acao.destaque');
        if (linkEditarModal) {
            linkEditarModal.href = urlCadastro(p.id);
        }

        const badge = document.getElementById('fichaBadge');
        if (badge) {
            if ((p.status || 'ativa') === 'ativa') {
                badge.className = 'badge-status status-ativo';
                badge.textContent = '● Ativa';
            } else {
                badge.className = 'badge-status status-inativo';
                badge.textContent = '○ Inativa';
            }
        }

        document.getElementById('modalFicha').classList.add('visivel');
    };

    window.abrirFicha = function (nome, cpf, tel, atendimentos, data) {
        document.getElementById('fichaNome').textContent = nome;
        document.getElementById('fichaCpf').textContent = cpf;
        document.getElementById('fichaTelefone').textContent = tel;
        document.getElementById('fichaAtendimentos').textContent = atendimentos;
        document.getElementById('fichaData').textContent = data;
        document.getElementById('modalFicha').classList.add('visivel');
    };

    window.fecharFicha = function () {
        document.getElementById('modalFicha').classList.remove('visivel');
    };

    // (aqui reside o django) -> Exclui no Banco de Dados Django (se online) e tb no localStorage!
    window.excluirPessoaPorId = async function (id) {
        const p = cachePessoas.find(item => String(item.id) === String(id));
        if (!p) return;

        if (!confirm(`Excluir "${p.nome}"? Essa ação remove o cadastro.`)) return;

        try {
            await fetch(`${API_URL}${encodeURIComponent(id)}/`, { method: 'DELETE' });
        } catch (err) {
            // se offline, remove do local
        }

        cachePessoas = cachePessoas.filter(item => String(item.id) !== String(id));
        salvarLocal(cachePessoas);
        renderizarTabela(cachePessoas);
    };

    window.addEventListener('click', function (e) {
        const modal = document.getElementById('modalFicha');
        if (e.target === modal) fecharFicha();
    });

    // (aqui reside o django) -> 5. Parte do Luiz integrada: carrega Solicitações de Cadastro Online do Django e permite Aprovar/Recusar!
    const API_SOLICITACOES = ((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/solicitacoes/';
    const tbodySol = document.getElementById('tbodySolicitacoes');

    async function carregarSolicitacoes() {
        if (!tbodySol) return;
        try {
            const resp = await fetch(API_SOLICITACOES);
            if (!resp.ok) throw new Error('offline');
            const json = await resp.json();
            renderizarSolicitacoes(json.solicitacoes || []);
        } catch (err) {
            // Fallback local se abrir sem o servidor
            const padraoSol = [
                { id: 1, nome: 'Roberto Almeida Souza', cpf: '678.901.234-55', telefone: '(21) 98811-2233', email: 'roberto.souza@email.com', estado_civil: 'Solteiro(a)', status: 'pendente', data_solicitacao: '14/11/2026' },
                { id: 2, nome: 'Luciana Ferreira Mendes', cpf: '789.012.345-66', telefone: '(21) 97722-3344', email: 'luciana.mendes@email.com', estado_civil: 'Casado(a)', status: 'pendente', data_solicitacao: '14/11/2026' }
            ];
            renderizarSolicitacoes(padraoSol);
        }
    }

    function renderizarSolicitacoes(lista) {
        if (!tbodySol) return;
        tbodySol.innerHTML = '';
        if (!lista.length) {
            tbodySol.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--texto-secundario);">Nenhuma solicitação encontrada.</td></tr>';
            return;
        }
        lista.forEach(s => {
            const tr = document.createElement('tr');
            const isPendente = s.status === 'pendente';
            const badge = isPendente
                ? '<span class="badge-atendimentos" style="background:#fef3c7; color:#92400e;">⏳ Pendente</span>'
                : (s.status === 'aprovada'
                    ? '<span class="badge-status status-ativo">✓ Aprovada</span>'
                    : '<span class="badge-status status-inativo">✕ Recusada</span>');

            const botoes = isPendente
                ? `<div class="acoes-tabela" style="justify-content: flex-end;">
                     <button type="button" class="btn-acao destaque" style="background:#15803d; color:#fff; border-color:#15803d;" onclick="decidirSolicitacao(${s.id}, 'aprovar', '${s.nome}')">✓ Aprovar e Cadastrar</button>
                     <button type="button" class="btn-excluir-item" onclick="decidirSolicitacao(${s.id}, 'recusar', '${s.nome}')">✕ Recusar</button>
                   </div>`
                : `<span style="font-size:12px; color:var(--texto-secundario);">Analisada</span>`;

            tr.innerHTML = `
                <td><strong>${s.nome}</strong><br><span style="font-size:11.5px; color:var(--texto-secundario);">Enviada em ${s.data_solicitacao}</span></td>
                <td>${s.cpf}</td>
                <td>${s.telefone}<br><span style="font-size:12px; color:var(--texto-secundario);">${s.email || ''}</span></td>
                <td>${s.estado_civil}</td>
                <td>${badge}</td>
                <td style="text-align: right;">${botoes}</td>
            `;
            tbodySol.appendChild(tr);
        });
    }

    window.decidirSolicitacao = async function (id, acao, nome) {
        const msg = acao === 'aprovar'
            ? `Aprovar a solicitação de "${nome}"? Isso criará o cadastro automaticamente na lista de Pessoas!`
            : `Recusar a solicitação de "${nome}"?`;
        if (!confirm(msg)) return;

        try {
            const resp = await fetch(API_SOLICITACOES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, acao: acao })
            });
            if (resp.ok) {
                await sincronizarComBanco();
                await carregarSolicitacoes();
                return;
            }
        } catch (err) {
            alert('Conecte o servidor Django para processar no banco.');
        }
    };

    sincronizarComBanco();
    carregarSolicitacoes();
});
