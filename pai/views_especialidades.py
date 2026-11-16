# (aqui reside o django)
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .models import Especialidades


# Lista as especialidades agrupadas por categoria (terapeutica, artesanato...)
@login_required
def listar_especialidades(request):
    # conta quantos acompanhamentos ativos (sem data de alta) cada uma tem
    especialidades = Especialidades.objects.annotate(
        ativos=Count(
            'acompanhamentos',
            filter=Q(acompanhamentos__data_alta__isnull=True)
        )
    ).order_by('nome')

    grupos = []
    for valor, titulo in Especialidades.CATEGORIA_CHOICES:
        grupos.append({
            'valor': valor,
            'titulo': titulo,
            'itens': [e for e in especialidades if e.categoria == valor],
        })

    return render(request, 'especialidades/lista.html', {
        'grupos': grupos,
        'categorias': Especialidades.CATEGORIA_CHOICES,
        'total': especialidades.count(),
    })


# Cria uma nova especialidade (vem do modal da tela)
@login_required
@require_POST
def criar_especialidade(request):
    nome = request.POST.get('nome', '').strip()
    categoria = request.POST.get('categoria', '')
    categorias_validas = [c[0] for c in Especialidades.CATEGORIA_CHOICES]

    if not nome or categoria not in categorias_validas:
        messages.error(request, 'Informe o nome e a categoria.')
    else:
        Especialidades.objects.create(nome=nome, categoria=categoria)
        messages.success(request, f'Especialidade "{nome}" cadastrada!')

    return redirect('listar_especialidades')


# Edita nome, categoria e situação (ativa/inativa)
@login_required
@require_POST
def editar_especialidade(request, especialidade_id):
    esp = get_object_or_404(Especialidades, id=especialidade_id)
    nome = request.POST.get('nome', '').strip()
    categoria = request.POST.get('categoria', esp.categoria)
    categorias_validas = [c[0] for c in Especialidades.CATEGORIA_CHOICES]

    if not nome or categoria not in categorias_validas:
        messages.error(request, 'Informe um nome e uma categoria válidos.')
    else:
        esp.nome = nome
        esp.categoria = categoria
        esp.ativa = request.POST.get('ativa') == 'on'
        esp.save()
        messages.success(request, f'"{esp.nome}" atualizada!')

    return redirect('listar_especialidades')


# Exclui. Se já tem acompanhamento ligado, o banco protege (PROTECT)
@login_required
@require_POST
def excluir_especialidade(request, especialidade_id):
    esp = get_object_or_404(Especialidades, id=especialidade_id)
    nome = esp.nome

    try:
        esp.delete()
        messages.success(request, f'"{nome}" excluída.')
    except ProtectedError:
        messages.error(
            request,
            f'"{nome}" já tem acompanhamentos ligados e não pode ser excluída. '
            'Marque como inativa no lugar.'
        )

    return redirect('listar_especialidades')
