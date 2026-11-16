# (aqui reside o django)
from django.contrib import admin
from .models import (
    Pessoa,
    Especialidades,
    Atendimento,
    Acompanhamento,
    SolicitacaoCadastro,
    ConfiguracaoLogin,
)

admin.site.site_header = 'Casa Maria de Magdala — Administração Django'
admin.site.site_title = 'Admin | Casa Maria de Magdala'
admin.site.index_title = 'Painel de Controle e Segurança do Sistema'


@admin.register(ConfiguracaoLogin)
class ConfiguracaoLoginAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'mostrar_preenchimento_automatico', 'permitir_redefinir_senha')
    list_editable = ('mostrar_preenchimento_automatico', 'permitir_redefinir_senha')


@admin.register(Pessoa)
class PessoaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cpf', 'telefone', 'origem_cadastro', 'ativo')
    search_fields = ('nome', 'cpf')
    list_filter = ('ativo', 'origem_cadastro')


@admin.register(SolicitacaoCadastro)
class SolicitacaoCadastroAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cpf', 'telefone', 'status', 'data_solicitacao')
    list_filter = ('status',)


admin.site.register(Especialidades)
admin.site.register(Atendimento)
admin.site.register(Acompanhamento)
