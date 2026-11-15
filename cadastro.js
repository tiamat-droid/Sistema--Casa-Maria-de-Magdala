/* ========================================================
   CADASTRO E EDIÇÃO DE PESSOAS (cadastro.js) — Conectado ao Django + BD!
   c/ comentários informais p/ facilitar o entendimento ;)
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const CHAVE_STORAGE = 'magdala_pessoas_v1';
    // (aqui reside o django) -> rota do Django p/ criar e editar pessoa no banco
    const API_URL = ((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/pessoas/';

    const params = new URLSearchParams(window.location.search);
    const idEdicao = params.get('id');

    function carregarLocal() {
        const salvo = localStorage.getItem(CHAVE_STORAGE);
        if (!salvo) return [];
        try { return JSON.parse(salvo); } catch (e) { return []; }
    }

    function preencherCampos(pessoa) {
        if (!pessoa) return;
        const tituloH1 = document.querySelector('.titulo-pagina h1');
        const descP = document.querySelector('.titulo-pagina .descricao');
        const btnSalvar = document.getElementById('btnSalvar');

        if (tituloH1) tituloH1.textContent = 'Editar cadastro: ' + pessoa.nome;
        if (descP) descP.textContent = 'Altere as informações necessárias abaixo e clique em Salvar alterações.';
        if (btnSalvar) btnSalvar.textContent = 'Salvar alterações';

        document.getElementById('nome').value = pessoa.nome || '';
        document.getElementById('cpf').value = pessoa.cpf || '';
        document.getElementById('data_nascimento').value = pessoa.data_nascimento || '';
        document.getElementById('estado_civil').value = pessoa.estado_civil || '';
        document.getElementById('telefone').value = pessoa.telefone || '';
        document.getElementById('endereco').value = pessoa.endereco || '';
        document.getElementById('nome_responsavel').value = pessoa.nome_responsavel || '';
        document.getElementById('data_entrada').value = pessoa.data_entrada || '';
        document.getElementById('origem_cadastro').value = pessoa.origem_cadastro || 'presencial';
    }

    // 1. Se tiver ?id=... na URL, busca os dados no Banco de Dados Django (ou no localStorage) e preenche o form!
    async function inicializarFormulario() {
        if (idEdicao) {
            try {
                const resp = await fetch(`${API_URL}${encodeURIComponent(idEdicao)}/`);
                if (resp.ok) {
                    const json = await resp.json();
                    if (json.pessoa) {
                        preencherCampos(json.pessoa);
                        return;
                    }
                }
            } catch (err) {
                // fallback p/ localStorage se o servidor Django estiver desligado
            }
            const lista = carregarLocal();
            const pessoa = lista.find(item => String(item.id) === String(idEdicao));
            if (pessoa) preencherCampos(pessoa);
        } else {
            const campoDataEntrada = document.getElementById('data_entrada');
            if (campoDataEntrada && !campoDataEntrada.value) {
                campoDataEntrada.valueAsDate = new Date();
            }
        }
    }

    // 2. Máscara de CPF em tempo real (000.000.000-00)
    const inputCpf = document.getElementById('cpf');
    if (inputCpf) {
        inputCpf.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.substring(0, 11);

            if (v.length > 9) {
                v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
            } else if (v.length > 6) {
                v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
            } else if (v.length > 3) {
                v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
            }
            e.target.value = v;
        });
    }

    // 3. Máscara de Telefone em tempo real ((00) 00000-0000)
    const inputTel = document.getElementById('telefone');
    if (inputTel) {
        inputTel.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.substring(0, 11);

            if (v.length > 10) {
                v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            } else if (v.length > 6) {
                v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
            } else if (v.length > 2) {
                v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
            } else if (v.length > 0) {
                v = v.replace(/^(\d*)$/, '($1');
            }
            e.target.value = v;
        });
    }

    // 4. Salvar pessoa (grava no Banco de Dados Django + atualiza localStorage!)
    window.salvarPessoa = async function (event) {
        event.preventDefault();

        const dadosForm = {
            nome: document.getElementById('nome').value.trim(),
            cpf: document.getElementById('cpf').value.trim(),
            data_nascimento: document.getElementById('data_nascimento').value,
            estado_civil: document.getElementById('estado_civil').value,
            telefone: document.getElementById('telefone').value.trim(),
            endereco: document.getElementById('endereco').value.trim(),
            nome_responsavel: document.getElementById('nome_responsavel').value.trim(),
            data_entrada: document.getElementById('data_entrada').value,
            origem_cadastro: document.getElementById('origem_cadastro').value
        };

        const btn = document.getElementById('btnSalvar');
        if (btn) {
            btn.innerHTML = 'Salvando...';
            btn.style.opacity = '0.7';
        }

        let salvouNoDjango = false;
        let pessoaRetornada = null;

        try {
            const url = idEdicao ? `${API_URL}${encodeURIComponent(idEdicao)}/` : API_URL;
            const metodo = idEdicao ? 'PUT' : 'POST';
            const resp = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosForm)
            });
            if (resp.ok) {
                const json = await resp.json();
                pessoaRetornada = json.pessoa;
                salvouNoDjango = true;
            }
        } catch (err) {
            // Servidor Django offline -> salva no localStorage normalmente
        }

        // Atualiza tb o localStorage p/ ficar sempre sincronizado
        const lista = carregarLocal();
        if (idEdicao) {
            const idx = lista.findIndex(item => String(item.id) === String(idEdicao));
            if (idx !== -1) {
                lista[idx] = Object.assign({}, lista[idx], pessoaRetornada || dadosForm);
            }
        } else {
            const nova = pessoaRetornada || Object.assign({
                id: 'p_' + Date.now(),
                atendimentos_resumo: '1 ativo',
                atendimentos_detalhe: 'Acolhimento Inicial',
                status: 'ativa'
            }, dadosForm);
            lista.unshift(nova);
        }
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));

        const banner = document.getElementById('bannerSucesso');
        if (banner) {
            banner.textContent = idEdicao
                ? '✓ Alterações salvas no banco de dados! Redirecionando...'
                : '✓ Pessoa cadastrada no banco de dados! Redirecionando...';
            banner.style.display = 'block';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const noDjango = window.location.pathname.indexOf('/interface/') !== -1;
        setTimeout(() => {
            window.location.href = noDjango ? '/interface/pessoas/' : 'pessoas.html';
        }, 800);
    };

    inicializarFormulario();
});
