# (aqui reside o django)
from pathlib import Path
from django.conf import settings
from django.http import FileResponse, Http404


def servir_arquivo_raiz(request, nome_arquivo='sistema.html'):
    # Serve diretamente os arquivos .html, .css e .js da pasta sistema da Gih!
    caminho = Path(settings.BASE_DIR) / nome_arquivo
    if not caminho.exists() or not caminho.is_file():
        raise Http404(f'Arquivo {nome_arquivo} não encontrado')

    sufixo = caminho.suffix.lower()
    tipos = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
    }
    content_type = tipos.get(sufixo, 'application/octet-stream')
    return FileResponse(open(caminho, 'rb'), content_type=content_type)


def interface(request, pagina='sistema'):
    pagina = pagina.replace('.html', '')
    return servir_arquivo_raiz(request, f'{pagina}.html')
