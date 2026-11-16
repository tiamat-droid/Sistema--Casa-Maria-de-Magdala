# (aqui reside o django)
from django.urls import path, re_path

from .views_interface import servir_arquivo_raiz, interface
from .views_api import (
    acessar_admin_direto,
    api_login,
    api_pessoas,
    api_pessoa_detalhe,
    api_solicitacoes,
    api_resumo_dashboard,
    api_relatorios,
    api_especialidades,
    api_atendimentos,
)
from .views_especialidades import (
    listar_especialidades,
    criar_especialidade,
    editar_especialidade,
    excluir_especialidade,
)
from .views import (
    login_view,
    cadastrar_pessoa,
    listar_pessoas,
    detalhes_pessoa,
    alterar_cadastro,
    alterar_status_pessoa,
    excluir_pessoa,
    cadastrar_atendimento,
    cadastrar_acompanhamento,
    solicitar_cadastro,
    solicitacao_enviada,
    listar_solicitacoes,
    detalhes_solicitacao,
    aprovar_solicitacao,
    recusar_solicitacao,
)

urlpatterns = [
    # Raiz abre direto a tela de Login da Gih!
    path('', servir_arquivo_raiz, {'nome_arquivo': 'login.html'}, name='home'),
    path('login/', login_view, name='login'),
    path('dashboard/', servir_arquivo_raiz, {'nome_arquivo': 'sistema.html'}, name='dashboard'),

    # APIs em Python/Django q conectam a interface da Gih ao Banco de Dados!
    path('acessar-admin/', acessar_admin_direto, name='acessar_admin_direto'),
    path('api/login/', api_login, name='api_login'),
    path('api/pessoas/', api_pessoas, name='api_pessoas'),
    path('api/pessoas/<int:pessoa_id>/', api_pessoa_detalhe, name='api_pessoa_detalhe'),
    path('api/solicitacoes/', api_solicitacoes, name='api_solicitacoes'),
    path('api/resumo/', api_resumo_dashboard, name='api_resumo_dashboard'),
    path('api/relatorios/', api_relatorios, name='api_relatorios'),
    path('api/especialidades/', api_especialidades, name='api_especialidades'),
    path('api/atendimentos/', api_atendimentos, name='api_atendimentos'),

    # Rotas Django criadas pelo Luiz (Solicitação pública online, etc.)
    path('solicitar-cadastro/', solicitar_cadastro, name='solicitar_cadastro'),
    path('solicitacao-enviada/', solicitacao_enviada, name='solicitacao_enviada'),
    path('solicitacoes/', listar_solicitacoes, name='listar_solicitacoes'),
    path('solicitacoes/<int:solicitacao_id>/', detalhes_solicitacao, name='detalhes_solicitacao'),
    path('solicitacoes/<int:solicitacao_id>/aprovar/', aprovar_solicitacao, name='aprovar_solicitacao'),
    path('solicitacoes/<int:solicitacao_id>/recusar/', recusar_solicitacao, name='recusar_solicitacao'),

    path('pessoas/cadastrar/', cadastrar_pessoa, name='cadastrar_pessoa'),
    path('pessoas/', listar_pessoas, name='listar_pessoas'),
    path('pessoas/<int:pessoa_id>/', detalhes_pessoa, name='detalhes_pessoa'),
    path('pessoas/<int:pessoa_id>/editar/', alterar_cadastro, name='editar_pessoa'),
    path('pessoas/<int:pessoa_id>/status/', alterar_status_pessoa, name='alterar_status_pessoa'),
    path('pessoas/<int:pessoa_id>/excluir/', excluir_pessoa, name='excluir_pessoa'),

    path('atendimentos/cadastrar/', cadastrar_atendimento, name='cadastrar_atendimento'),
    path('acompanhamentos/cadastrar/', cadastrar_acompanhamento, name='cadastrar_acompanhamento'),

    path('especialidades/', listar_especialidades, name='listar_especialidades'),
    path('especialidades/nova/', criar_especialidade, name='criar_especialidade'),
    path('especialidades/<int:especialidade_id>/editar/', editar_especialidade, name='editar_especialidade'),
    path('especialidades/<int:especialidade_id>/excluir/', excluir_especialidade, name='excluir_especialidade'),

    path('interface/<str:pagina>/', interface, name='interface'),

    # Serve diretamente qualquer .html, .css, .js ou foto da pasta sistema da Gih!
    re_path(r'^(?P<nome_arquivo>[\w-]+\.(html|css|js|jpg|jpeg|png|webp))$', servir_arquivo_raiz),
]
