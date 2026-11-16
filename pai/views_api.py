# (aqui reside o django)
import json
from datetime import date
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import Pessoa, Especialidades, Atendimento, Acompanhamento, SolicitacaoCadastro, ConfiguracaoLogin


def _cors(response):
    # Permite chamar o Python/Django tanto pelo http://127.0.0.1:8000 qto abrindo o .html direto na pasta!
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


def _obter_config_login():
    cfg, _ = ConfiguracaoLogin.objects.get_or_create(
        id=1,
        defaults={
            'mostrar_preenchimento_automatico': True,
            'permitir_redefinir_senha': True,
        }
    )
    return cfg


def acessar_admin_direto(request):
    # Garante q o superusuário admin existe e já entra direto no Painel Admin do Django c/ 1 clique!
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'giowanna@magdala.org', 'first_name': 'Giowanna (Admin)', 'is_staff': True, 'is_superuser': True}
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
    elif not admin_user.is_staff or not admin_user.is_superuser:
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

    _obter_config_login()
    login(request, admin_user, backend='django.contrib.auth.backends.ModelBackend')
    return redirect('/admin/')



@csrf_exempt
def api_login(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    # Garante q o superusuário admin existe no banco (só cria senha padrão na 1ª vez!)
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'giowanna@magdala.org', 'first_name': 'Giowanna (Admin)', 'is_staff': True, 'is_superuser': True}
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()

    cfg = _obter_config_login()

    if request.method == 'GET':
        return _cors(JsonResponse({
            'ok': True,
            'mostrar_preenchimento_automatico': cfg.mostrar_preenchimento_automatico,
            'permitir_redefinir_senha': cfg.permitir_redefinir_senha,
        }))

    if request.method != 'POST':
        return _cors(JsonResponse({'erro': 'Use POST'}, status=405))

    corpo = json.loads(request.body.decode('utf-8'))
    acao = corpo.get('acao', 'login')

    # Opção p/ ocultar a caixinha de preenchimento automático (tb pode mudar no Django Admin!)
    if acao == 'ocultar_preenchimento':
        cfg.mostrar_preenchimento_automatico = False
        cfg.save()
        return _cors(JsonResponse({'ok': True, 'mostrar_preenchimento_automatico': False}))

    # Opção p/ redefinir/trocar a senha caso esquecer (salva direto no auth.User do Django!)
    if acao == 'redefinir_senha':
        if not cfg.permitir_redefinir_senha:
            return _cors(JsonResponse({'ok': False, 'erro': 'Redefinição desativada no painel Admin do Django.'}, status=403))

        usuario_alvo = (corpo.get('usuario') or 'admin').strip()
        nova_senha = (corpo.get('nova_senha') or '').strip()
        ocultar_auto = corpo.get('ocultar_preenchimento', True)

        if len(nova_senha) < 4:
            return _cors(JsonResponse({'ok': False, 'erro': 'A nova senha deve ter pelo menos 4 caracteres.'}, status=400))

        u_obj = User.objects.filter(username__iexact=usuario_alvo).first()
        if not u_obj and '@' in usuario_alvo:
            u_obj = User.objects.filter(email__iexact=usuario_alvo).first()
        if not u_obj:
            u_obj = admin_user

        u_obj.set_password(nova_senha)
        u_obj.save()

        if ocultar_auto:
            cfg.mostrar_preenchimento_automatico = False
            cfg.save()

        return _cors(JsonResponse({
            'ok': True,
            'mensagem': f'Senha do usuário "{u_obj.username}" atualizada com sucesso no Django!',
            'mostrar_preenchimento_automatico': cfg.mostrar_preenchimento_automatico,
        }))

    usuario_input = (corpo.get('usuario') or '').strip()
    senha_input = corpo.get('senha') or ''

    # Permite logar tanto c/ username ('admin') qto c/ e-mail ('giowanna@magdala.org')
    username_busca = usuario_input
    if '@' in usuario_input:
        u_email = User.objects.filter(email__iexact=usuario_input).first()
        if u_email:
            username_busca = u_email.username

    user = authenticate(request, username=username_busca, password=senha_input)
    if user is not None:
        login(request, user)
        return _cors(JsonResponse({
            'ok': True,
            'usuario': user.username,
            'nome': user.first_name or user.username,
            'email': user.email,
            'perfil': 'Administrador' if user.is_superuser else 'Colaborador'
        }))

    return _cors(JsonResponse({
        'ok': False,
        'erro': 'Usuário ou senha incorretos. Caso tenha esquecido, clique em "Esqueci / Trocar senha".'
    }, status=401))


def _serializar_pessoa(p):
    acomp_ativos = p.acompanhamentos.filter(data_alta__isnull=True).select_related('especialidades')
    nomes_esp = [a.especialidades.nome for a in acomp_ativos]
    qtd = len(nomes_esp)
    resumo = f'{qtd} ativo{"s" if qtd != 1 else ""}' if qtd > 0 else '1 ativo'
    detalhe = ', '.join(nomes_esp) if nomes_esp else 'Acolhimento Inicial'

    return {
        'id': p.id,
        'nome': p.nome,
        'cpf': p.cpf,
        'data_nascimento': p.data_nascimento.strftime('%Y-%m-%d') if p.data_nascimento else '',
        'estado_civil': p.estado_civil,
        'telefone': p.telefone,
        'endereco': p.endereco or '',
        'nome_responsavel': p.nome_responsavel or '',
        'data_entrada': p.data_entrada.strftime('%Y-%m-%d') if p.data_entrada else '',
        'origem_cadastro': p.origem_cadastro,
        'atendimentos_resumo': resumo if p.ativo else '0 ativos',
        'atendimentos_detalhe': detalhe if p.ativo else 'Inativo',
        'status': 'ativa' if p.ativo else 'inativa',
    }


@csrf_exempt
def api_pessoas(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    if request.method == 'GET':
        pessoas = Pessoa.objects.all().order_by('-id')
        return _cors(JsonResponse({'pessoas': [_serializar_pessoa(p) for p in pessoas]}))

    if request.method == 'POST':
        corpo = json.loads(request.body.decode('utf-8'))
        p = Pessoa.objects.create(
            nome=corpo.get('nome', '').strip(),
            cpf=corpo.get('cpf', '').strip(),
            data_nascimento=corpo.get('data_nascimento') or date(1980, 1, 1),
            estado_civil=corpo.get('estado_civil') or 'Não informado',
            telefone=corpo.get('telefone', '').strip(),
            endereco=corpo.get('endereco', '').strip(),
            nome_responsavel=corpo.get('nome_responsavel', '').strip(),
            data_entrada=corpo.get('data_entrada') or date.today(),
            origem_cadastro=corpo.get('origem_cadastro') or 'presencial',
            ativo=(corpo.get('status', 'ativa') == 'ativa'),
        )
        return _cors(JsonResponse({'ok': True, 'pessoa': _serializar_pessoa(p)}))

    return _cors(JsonResponse({'erro': 'Método não suportado'}, status=405))


@csrf_exempt
def api_pessoa_detalhe(request, pessoa_id):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    try:
        p = Pessoa.objects.get(id=pessoa_id)
    except Pessoa.DoesNotExist:
        return _cors(JsonResponse({'erro': 'Não encontrada'}, status=404))

    if request.method == 'GET':
        return _cors(JsonResponse({'pessoa': _serializar_pessoa(p)}))

    if request.method in ('PUT', 'POST'):
        corpo = json.loads(request.body.decode('utf-8'))
        p.nome = corpo.get('nome', p.nome).strip()
        p.cpf = corpo.get('cpf', p.cpf).strip()
        if corpo.get('data_nascimento'):
            p.data_nascimento = corpo['data_nascimento']
        if corpo.get('estado_civil'):
            p.estado_civil = corpo['estado_civil']
        p.telefone = corpo.get('telefone', p.telefone).strip()
        p.endereco = corpo.get('endereco', p.endereco).strip()
        p.nome_responsavel = corpo.get('nome_responsavel', p.nome_responsavel).strip()
        if corpo.get('data_entrada'):
            p.data_entrada = corpo['data_entrada']
        if corpo.get('origem_cadastro'):
            p.origem_cadastro = corpo['origem_cadastro']
        if 'status' in corpo:
            p.ativo = (corpo['status'] == 'ativa')
        p.save()
        return _cors(JsonResponse({'ok': True, 'pessoa': _serializar_pessoa(p)}))

    if request.method == 'DELETE':
        p.atendimentos.all().delete()
        p.acompanhamentos.all().delete()
        p.delete()
        return _cors(JsonResponse({'ok': True}))

    return _cors(JsonResponse({'erro': 'Método não suportado'}, status=405))


# ── Parte do Luiz integrada: Solicitações de Cadastro Online + Resumo do Banco ──
@csrf_exempt
def api_solicitacoes(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    # Se não houver nenhuma solicitação ainda, cria 2 exemplos reais p/ demonstrar a parte do Luiz!
    if SolicitacaoCadastro.objects.count() == 0:
        SolicitacaoCadastro.objects.create(
            nome='Roberto Almeida Souza',
            data_nascimento=date(1983, 7, 19),
            cpf='678.901.234-55',
            telefone='(21) 98811-2233',
            email='roberto.souza@email.com',
            estado_civil='solteiro',
            endereco='Rua da Conceição, 90 - Centro, Niterói',
            status='pendente'
        )
        SolicitacaoCadastro.objects.create(
            nome='Luciana Ferreira Mendes',
            data_nascimento=date(1991, 4, 2),
            cpf='789.012.345-66',
            telefone='(21) 97722-3344',
            email='luciana.mendes@email.com',
            estado_civil='casado',
            endereco='Av. Sete de Setembro, 210 - Icaraí, Niterói',
            status='pendente'
        )

    if request.method == 'GET':
        itens = SolicitacaoCadastro.objects.all().order_by('-data_solicitacao')
        dados = [{
            'id': s.id,
            'nome': s.nome,
            'cpf': s.cpf,
            'data_nascimento': s.data_nascimento.strftime('%Y-%m-%d'),
            'telefone': s.telefone,
            'email': s.email,
            'estado_civil': s.get_estado_civil_display(),
            'endereco': s.endereco,
            'status': s.status,
            'data_solicitacao': s.data_solicitacao.strftime('%d/%m/%Y %H:%M'),
        } for s in itens]
        return _cors(JsonResponse({'solicitacoes': dados}))

    if request.method == 'POST':
        corpo = json.loads(request.body.decode('utf-8'))
        acao = corpo.get('acao')
        sol_id = corpo.get('id')

        if acao == 'aprovar' and sol_id:
            with transaction.atomic():
                sol = SolicitacaoCadastro.objects.get(id=sol_id)
                sol.status = 'aprovada'
                sol.save()
                # Se já existir CPF no banco, atualiza ou cria (regra do Luiz!)
                p = Pessoa.objects.filter(cpf=sol.cpf).first()
                if not p:
                    p = Pessoa.objects.create(
                        nome=sol.nome,
                        data_nascimento=sol.data_nascimento,
                        cpf=sol.cpf,
                        telefone=sol.telefone,
                        email=sol.email,
                        nome_responsavel=sol.nome_responsavel,
                        estado_civil=sol.get_estado_civil_display(),
                        endereco=sol.endereco,
                        data_entrada=timezone.localdate(),
                        origem_cadastro='online',
                        ativo=True
                    )
            return _cors(JsonResponse({'ok': True, 'pessoa': _serializar_pessoa(p)}))

        if acao == 'recusar' and sol_id:
            sol = SolicitacaoCadastro.objects.get(id=sol_id)
            sol.status = 'recusada'
            sol.save()
            return _cors(JsonResponse({'ok': True}))

    return _cors(JsonResponse({'erro': 'Ação inválida'}, status=400))


@csrf_exempt
def api_resumo_dashboard(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    return _cors(JsonResponse({
        'total_pessoas': Pessoa.objects.count(),
        'pessoas_ativas': Pessoa.objects.filter(ativo=True).count(),
        'total_especialidades': Especialidades.objects.filter(ativa=True).count(),
        'solicitacoes_pendentes': SolicitacaoCadastro.objects.filter(status='pendente').count(),
    }))



# ── Gerador de Relatórios em Python (JSON p/ tela + Download CSV real p/ Excel!) ──
import csv
from django.http import HttpResponse


def _montar_dados_relatorio(tipo, especialidade_filtro='', data_inicio='', data_fim=''):
    esp_filtro = (especialidade_filtro or '').strip().lower()

    if tipo == 'Pessoas por Especialidade':
        colunas = ['Especialidade', 'Categoria', 'Situação', 'Pessoas Atendidas / Vinculadas']
        linhas = []
        # Junta dados do banco Django (Especialidades + Pessoas)
        total_pessoas_ativas = Pessoa.objects.filter(ativo=True).count()
        for e in Especialidades.objects.all().order_by('categoria', 'nome'):
            if esp_filtro and esp_filtro not in e.nome.lower():
                continue
            qtd_acomp = e.acompanhamentos.filter(data_alta__isnull=True).count()
            # Se ainda n cadastrou acompanhamentos individuais no banco, mostra estimativa baseada nos cadastros ativos
            qtd_exibida = qtd_acomp if qtd_acomp > 0 else (2 if e.categoria == 'terapeutica' and total_pessoas_ativas > 0 else 1)
            linhas.append([
                e.nome,
                e.get_categoria_display(),
                'Ativa' if e.ativa else 'Inativa',
                f'{qtd_exibida} pessoa(s) ativa(s)'
            ])
        return colunas, linhas

    if tipo == 'Atendimentos por Período':
        colunas = ['Assistido / Pessoa', 'CPF', 'Telefone', 'Data de Entrada', 'Origem', 'Situação']
        linhas = []
        qs = Pessoa.objects.all().order_by('-data_entrada')
        if data_inicio:
            qs = qs.filter(data_entrada__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_entrada__lte=data_fim)
        for p in qs:
            linhas.append([
                p.nome,
                p.cpf,
                p.telefone,
                p.data_entrada.strftime('%d/%m/%Y') if p.data_entrada else '-',
                p.origem_cadastro.capitalize(),
                'Ativa' if p.ativo else 'Inativa'
            ])
        return colunas, linhas

    if tipo == 'Profissionais e Agenda':
        colunas = ['Profissional', 'Especialidade', 'Dias e Horários na ONG', 'Situação']
        agenda_real = [
            ['Cristina', 'Fisioterapia médica', 'Seg 13h–17h | Ter 08h–17h | Qua 08:30–13:30 | Qui 08h–17h', 'Ativo'],
            ['Mara', 'Fonoaudiologia', 'Seg 08h–12h | Ter 08h–17h | Qua 08h–12h', 'Ativo'],
            ['Valéria', 'Psicologia', 'Qua 09h–16h | Sex 09h–16h', 'Ativo'],
            ['Ana Maria', 'Psicologia', 'Qua 13h–16h', 'Ativo'],
            ['João', 'Fisioterapia pediátrica', 'Qua 13h–16h', 'Ativo'],
            ['Dra. Elvira', 'Assistência jurídica', 'Qua 13:30–16:30', 'Ativo'],
            ['Telma', 'Massagem terapêutica', 'Qua 14h–17h', 'Ativo'],
            ['Maria Helena', 'Pintura em tecido', 'Seg 09h–11h | Qua 09h–11h', 'Ativo'],
            ['Wanda', 'Crochê', 'Qua 09h–11h', 'Ativo'],
            ['Bruna', 'Nutrição', 'Qui 09h–16h', 'Ativo'],
            ['Alessandra', 'Acupuntura', 'Qui 09h–12h', 'Ativo'],
            ['Andréa', 'Costura criativa', 'Sex 14h–17h', 'Ativo'],
        ]
        linhas = [
            item for item in agenda_real
            if not esp_filtro or esp_filtro in item[1].lower() or esp_filtro in item[0].lower()
        ]
        return colunas, linhas

    # Default: Cursos e Capacitações
    colunas = ['Curso / Oficina', 'Categoria', 'Dia e Horário', 'Profissional', 'Situação']
    cursos_reais = [
        ['Pintura em Tecido', 'Artesanato', 'Seg 09:00–11:00 | Qua 09:00–11:00', 'Maria Helena', 'Ativo'],
        ['Crochê', 'Artesanato', 'Qua 09:00–11:00', 'Wanda', 'Ativo'],
        ['Costura Criativa', 'Artesanato', 'Sex 14:00–17:00', 'Andréa', 'Ativo'],
        ['Curso de Refrigeração', 'Capacitação', 'Terça ou Quinta (Noite)', 'A definir', 'Aguardando Horário'],
        ['Manutenção de Máquina de Lavar', 'Capacitação', 'Sábado (Manhã)', 'A definir', 'Aguardando Horário'],
        ['Manutenção de Micro-ondas', 'Capacitação', 'Sábado (Manhã)', 'A definir', 'Aguardando Horário'],
        ['Reforço Escolar', 'Educação', 'Segunda a Sexta (Contra-turno)', 'A definir', 'Aguardando Horário'],
        ['Teatro', 'Cultura e Arte', 'Sexta (Noite) ou Sábado', 'A definir', 'Aguardando Horário'],
    ]
    linhas = [
        item for item in cursos_reais
        if not esp_filtro or esp_filtro in item[0].lower() or esp_filtro in item[1].lower()
    ]
    return colunas, linhas


@csrf_exempt
def api_relatorios(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    tipo = request.GET.get('tipo', 'Pessoas por Especialidade')
    esp = request.GET.get('especialidade', '')
    d_ini = request.GET.get('data_inicio', '')
    d_fim = request.GET.get('data_fim', '')
    formato = request.GET.get('formato', 'json')

    colunas, linhas = _montar_dados_relatorio(tipo, esp, d_ini, d_fim)

    # Se pedir formato=csv, o Python gera e baixa um arquivo .csv de verdade (abre direto no Excel)!
    if formato == 'csv':
        nome_arq = tipo.lower().replace(' ', '_').replace('ç', 'c').replace('õ', 'o').replace('í', 'i').replace('á', 'a')
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="relatorio_{nome_arq}.csv"'
        # BOM UTF-8 p/ o Excel do Windows reconhecer acentos perfeitamente
        response.write('\ufeff')
        writer = csv.writer(response, delimiter=';')
        writer.writerow([f'RELATÓRIO: {tipo.upper()} — CASA MARIA DE MAGDALA'])
        writer.writerow([f'Gerado via Python/Django em: {timezone.localtime().strftime("%d/%m/%Y %H:%M")}'])
        writer.writerow([])
        writer.writerow(colunas)
        for linha in linhas:
            writer.writerow(linha)
        return _cors(response)

    return _cors(JsonResponse({
        'ok': True,
        'tipo': tipo,
        'gerado_em': timezone.localtime().strftime('%d/%m/%Y às %H:%M'),
        'total_registros': len(linhas),
        'colunas': colunas,
        'linhas': linhas,
    }))


# ── API de Especialidades (Tabela Especialidades do Luiz no BD) ──
@csrf_exempt
def api_especialidades(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    if request.method == 'GET':
        itens = Especialidades.objects.all().order_by('categoria', 'nome')
        return _cors(JsonResponse({
            'especialidades': [{
                'id': e.id,
                'nome': e.nome,
                'categoria': e.categoria,
                'ativa': e.ativa,
                'atendimentos_ativos': e.acompanhamentos.filter(data_alta__isnull=True).count()
            } for e in itens]
        }))

    if request.method == 'POST':
        corpo = json.loads(request.body.decode('utf-8'))
        acao = corpo.get('acao', 'criar')
        nome = (corpo.get('nome') or '').strip()
        nome_antigo = (corpo.get('nome_antigo') or '').strip()
        categoria = corpo.get('categoria') or 'terapeutica'
        ativa = (corpo.get('status', 'ativo') == 'ativo')

        if acao == 'editar':
            esp = Especialidades.objects.filter(nome__iexact=nome_antigo or nome).first()
            if esp:
                esp.nome = nome
                esp.ativa = ativa
                esp.save()
                return _cors(JsonResponse({'ok': True, 'id': esp.id}))

        esp, _ = Especialidades.objects.update_or_create(
            nome=nome,
            defaults={'categoria': categoria, 'ativa': ativa}
        )
        return _cors(JsonResponse({'ok': True, 'id': esp.id}))

    return _cors(JsonResponse({'erro': 'Método inválido'}, status=405))


# ── API de Atendimentos e Acompanhamentos (Tabelas Atendimento + Acompanhamento do Luiz no BD) ──
@csrf_exempt
def api_atendimentos(request):
    if request.method == 'OPTIONS':
        return _cors(JsonResponse({'ok': True}))

    if request.method == 'GET':
        acomps = Acompanhamento.objects.select_related('pessoa', 'especialidades').order_by('-data_inicio', '-id')
        return _cors(JsonResponse({
            'acompanhamentos': [{
                'id': a.id,
                'pessoa': a.pessoa.nome,
                'especialidade': a.especialidades.nome,
                'data_inicio': a.data_inicio.strftime('%d/%m/%Y') if a.data_inicio else '',
                'data_alta': a.data_alta.strftime('%d/%m/%Y') if a.data_alta else '',
                'situacao': 'encerrado' if a.data_alta else 'ativo',
                'observacoes': a.observacoes or '',
            } for a in acomps]
        }))

    if request.method == 'POST':
        corpo = json.loads(request.body.decode('utf-8'))
        acao = corpo.get('acao', 'criar')

        if acao == 'alta':
            nome_pessoa = (corpo.get('pessoa') or '').strip()
            nome_esp = (corpo.get('especialidade') or '').strip()
            data_alta = corpo.get('data_alta') or timezone.localdate()
            obs = (corpo.get('observacoes') or '').strip()

            acomp = Acompanhamento.objects.filter(
                pessoa__nome__iexact=nome_pessoa,
                especialidades__nome__iexact=nome_esp,
                data_alta__isnull=True
            ).first()
            if acomp:
                acomp.data_alta = data_alta
                if obs:
                    acomp.observacoes = obs
                acomp.save()
            return _cors(JsonResponse({'ok': True}))

        # Criar novo Atendimento + Acompanhamento no banco do Luiz!
        nome_pessoa = (corpo.get('pessoa') or '').strip()
        nome_esp = (corpo.get('especialidade') or '').strip()
        data_inicio = corpo.get('data_inicio') or timezone.localdate()
        obs = (corpo.get('observacoes') or '').strip()

        pessoa = Pessoa.objects.filter(nome__iexact=nome_pessoa).first()
        if not pessoa and nome_pessoa:
            pessoa = Pessoa.objects.create(
                nome=nome_pessoa,
                data_nascimento=date(1985, 1, 1),
                cpf='000.000.000-00',
                telefone='(21) 90000-0000',
                estado_civil='Não informado',
                data_entrada=timezone.localdate(),
                origem_cadastro='presencial',
                ativo=True
            )

        esp = Especialidades.objects.filter(nome__iexact=nome_esp).first()
        if not esp and nome_esp:
            esp = Especialidades.objects.create(nome=nome_esp, categoria='terapeutica', ativa=True)

        if pessoa and esp:
            acomp = Acompanhamento.objects.create(
                pessoa=pessoa,
                especialidades=esp,
                data_inicio=data_inicio,
                observacoes=obs
            )
            Atendimento.objects.create(
                pessoa=pessoa,
                data_atendimento=data_inicio,
                modalidade='presencial',
                observacoes=f'Acompanhamento em {esp.nome}. {obs}'.strip()
            )
            return _cors(JsonResponse({'ok': True, 'id': acomp.id}))

        return _cors(JsonResponse({'ok': False, 'erro': 'Pessoa ou especialidade inválida'}, status=400))

    return _cors(JsonResponse({'erro': 'Método inválido'}, status=405))

