/* ========================================================
   LOGIN CONECTADO AO DJANGO (login.js)
   c/ comentários informais p/ facilitar o entendimento ;)
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const campoUsuario = document.getElementById('usuario');
    const campoSenha = document.getElementById('senha');
    const btnToggleSenha = document.getElementById('btnToggleSenha');
    const btnAcessar = document.getElementById('btnAcessar');
    const alertaErro = document.getElementById('alertaErro');
    const alertaSucesso = document.getElementById('alertaSucessoLogin');
    const boxPreenchimento = document.getElementById('boxPreenchimentoRapido');
    const btnEsqueci = document.getElementById('btnEsqueciSenha');
    // (aqui reside o django) -> rota de login e config de senha no Python/Django (/api/login/)
    const API_LOGIN = ((window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://127.0.0.1:8000' : '') + '/api/login/';

    // Consulta no Django Admin se o botão de preencher automático está ativado ou oculto!
    async function carregarConfigLoginDjango() {
        if (localStorage.getItem('magdala_ocultar_auto_login') === '1' && boxPreenchimento) {
            boxPreenchimento.style.display = 'none';
        }
        try {
            const r = await fetch(API_LOGIN);
            if (!r.ok) return;
            const cfg = await r.json();
            if (boxPreenchimento) {
                boxPreenchimento.style.display = cfg.mostrar_preenchimento_automatico ? 'flex' : 'none';
            }
            if (btnEsqueci) {
                btnEsqueci.style.display = cfg.permitir_redefinir_senha ? 'inline-block' : 'none';
            }
        } catch (e) {}
    }
    carregarConfigLoginDjango();

    // 1. Mostrar/esconder a senha qdo clica no olhinho
    window.alternarVisibilidadeSenha = function () {
        if (!campoSenha || !btnToggleSenha) return;

        if (campoSenha.type === 'password') {
            campoSenha.type = 'text';
            btnToggleSenha.innerHTML = '🙈 Esconder';
        } else {
            campoSenha.type = 'password';
            btnToggleSenha.innerHTML = '👁️ Mostrar';
        }
    };

    // 2. Botão rápido p/ preencher admin (c/ a senha oculta nos pontinhos, sem expor na tela!)
    window.preencherAdmin = function () {
        const senhaSalva = localStorage.getItem('magdala_senha_admin_atual') || 'admin123';
        if (campoUsuario) campoUsuario.value = 'admin';
        if (campoSenha) {
            campoSenha.type = 'password';
            campoSenha.value = senhaSalva;
        }
        if (alertaErro) alertaErro.style.display = 'none';
    };

    // Oculta o botão de preenchimento rápido e salva essa escolha lá no Django Admin!
    window.ocultarPreenchimentoRapido = async function () {
        if (boxPreenchimento) boxPreenchimento.style.display = 'none';
        localStorage.setItem('magdala_ocultar_auto_login', '1');
        try {
            await fetch(API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao: 'ocultar_preenchimento' })
            });
        } catch (e) {}
    };

    // Modal de Esqueci minha senha / Trocar senha (salva direto no Django!)
    window.abrirModalSenha = function () {
        const modal = document.getElementById('modalRedefinirSenha');
        const erroM = document.getElementById('erroModalSenha');
        if (erroM) erroM.style.display = 'none';
        if (modal) modal.classList.add('visivel');
    };

    window.fecharModalSenha = function () {
        const modal = document.getElementById('modalRedefinirSenha');
        if (modal) modal.classList.remove('visivel');
    };

    window.salvarNovaSenhaDjango = async function () {
        const u = (document.getElementById('resetUsuario').value || 'admin').trim();
        const s1 = document.getElementById('resetNovaSenha').value || '';
        const s2 = document.getElementById('resetConfirmaSenha').value || '';
        const ocultarAuto = document.getElementById('chkOcultarAuto').checked;
        const erroM = document.getElementById('erroModalSenha');

        if (s1.length < 4) {
            erroM.textContent = 'A nova senha precisa ter pelo menos 4 caracteres.';
            erroM.style.display = 'block';
            return;
        }
        if (s1 !== s2) {
            erroM.textContent = 'As senhas digitadas não conferem.';
            erroM.style.display = 'block';
            return;
        }

        // Salva tb no fallback local e atualiza no banco do Django!
        localStorage.setItem('magdala_senha_admin_atual', s1);
        if (ocultarAuto) {
            localStorage.setItem('magdala_ocultar_auto_login', '1');
            if (boxPreenchimento) boxPreenchimento.style.display = 'none';
        }

        try {
            const resp = await fetch(API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    acao: 'redefinir_senha',
                    usuario: u,
                    nova_senha: s1,
                    ocultar_preenchimento: ocultarAuto
                })
            });
            const dados = await resp.json();
            if (!resp.ok || !dados.ok) {
                erroM.textContent = dados.erro || 'Não foi possível atualizar a senha.';
                erroM.style.display = 'block';
                return;
            }
        } catch (e) {}

        fecharModalSenha();
        if (campoUsuario) campoUsuario.value = u;
        if (campoSenha) campoSenha.value = '';
        if (alertaErro) alertaErro.style.display = 'none';
        if (alertaSucesso) {
            alertaSucesso.textContent = '✅ Senha alterada com sucesso! Faça login com a sua nova senha.';
            alertaSucesso.style.display = 'block';
        }
    };

    // 3. Autenticação real no Django (Python) + fallback local
    window.realizarLogin = async function (event) {
        event.preventDefault();

        const u = (campoUsuario ? campoUsuario.value : '').trim();
        const s = campoSenha ? campoSenha.value : '';

        if (alertaErro) alertaErro.style.display = 'none';
        if (btnAcessar) {
            btnAcessar.innerHTML = 'Verificando...';
            btnAcessar.style.opacity = '0.7';
        }

        // (aqui reside o django) -> Tenta autenticar no servidor Python/Django primeiro
        try {
            const resp = await fetch(API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: u, senha: s })
            });
            const dados = await resp.json();

            if (resp.ok && dados.ok) {
                localStorage.setItem('magdala_usuario_logado', JSON.stringify(dados));
                window.location.href = 'sistema.html';
                return;
            } else {
                mostrarErro(dados.erro || 'Usuário ou senha incorretos. Se esqueceu, clique em "Esqueci / Trocar senha".');
                return;
            }
        } catch (err) {
            // Se o servidor Django estiver desligado, valida localmente os usuários principais
            const senhaAtual = localStorage.getItem('magdala_senha_admin_atual') || 'admin123';
            const validos = [
                { user: 'admin', email: 'giowanna@magdala.org', pass: senhaAtual, nome: 'Giowanna (Admin)' },
                { user: 'luiz', email: 'luiz@magdala.org', pass: senhaAtual, nome: 'Luiz Guilherme' },
                { user: 'diva', email: 'diva@magdala.org', pass: senhaAtual, nome: 'Diva (Coordenação)' }
            ];
            const achou = validos.find(item =>
                (item.user === u.toLowerCase() || item.email === u.toLowerCase()) && item.pass === s
            );

            if (achou) {
                localStorage.setItem('magdala_usuario_logado', JSON.stringify(achou));
                window.location.href = 'sistema.html';
            } else {
                mostrarErro('Usuário ou senha incorretos! Se esqueceu, clique em "Esqueci / Trocar senha".');
            }
        }
    };

    function mostrarErro(msg) {
        if (alertaErro) {
            alertaErro.textContent = msg;
            alertaErro.style.display = 'block';
        }
        if (btnAcessar) {
            btnAcessar.innerHTML = 'Acessar Sistema';
            btnAcessar.style.opacity = '1';
        }
    }

    // 4. Carrossel das fotos da ONG passando a cada 9 segundos (9000ms)!
    const slides = document.querySelectorAll('.slide-login');
    const bolinhas = document.querySelectorAll('.bolinha-carrossel');
    let slideAtual = 0;
    let timerCarrossel = null;

    function mostrarSlide(indice) {
        if (!slides.length) return;
        slideAtual = (indice + slides.length) % slides.length;

        slides.forEach(function (img, i) {
            img.classList.toggle('ativo', i === slideAtual);
        });
        bolinhas.forEach(function (bol, i) {
            bol.classList.toggle('ativa', i === slideAtual);
        });
    }

    function iniciarTimerCarrossel() {
        if (timerCarrossel) clearInterval(timerCarrossel);
        timerCarrossel = setInterval(function () {
            mostrarSlide(slideAtual + 1);
        }, 9000); // 9 segs certinho p/ cada foto!
    }

    // Qdo clicar numa bolinha, troca a foto na hora e reinicia os 9s
    window.irParaSlide = function (indice) {
        mostrarSlide(indice);
        iniciarTimerCarrossel();
    };

    if (slides.length > 1) {
        iniciarTimerCarrossel();
    }
});
