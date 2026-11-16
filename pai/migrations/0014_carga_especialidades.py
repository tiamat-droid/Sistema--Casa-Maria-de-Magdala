from django.db import migrations

# As 22 especialidades confirmadas pela Diva (coordenação da ONG)
ESPECIALIDADES = [
    ('Fisioterapia médica', 'terapeutica'),
    ('Fisioterapia pediátrica', 'terapeutica'),
    ('Fonoaudiologia', 'terapeutica'),
    ('Acupuntura', 'terapeutica'),
    ('Massagem terapêutica', 'terapeutica'),
    ('Reflexologia', 'terapeutica'),
    ('Reiki', 'terapeutica'),
    ('Nutrição', 'terapeutica'),
    ('Psicologia', 'terapeutica'),
    ('Assistência jurídica', 'terapeutica'),
    ('Serviço social', 'terapeutica'),
    ('Pintura em tecido', 'artesanato'),
    ('Crochê', 'artesanato'),
    ('Bijuteria', 'artesanato'),
    ('Costura criativa', 'artesanato'),
    ('Refrigeração', 'capacitacao'),
    ('Manutenção de máquina de lavar', 'capacitacao'),
    ('Manutenção de micro-ondas', 'capacitacao'),
    ('Reforço escolar', 'educacao'),
    ('Teatro', 'educacao'),
]


def carregar(apps, schema_editor):
    Especialidades = apps.get_model('core', 'Especialidades')
    for nome, categoria in ESPECIALIDADES:
        # get_or_create: se rodar 2x não duplica
        Especialidades.objects.get_or_create(
            nome=nome, defaults={'categoria': categoria, 'ativa': True}
        )


def desfazer(apps, schema_editor):
    Especialidades = apps.get_model('core', 'Especialidades')
    Especialidades.objects.filter(nome__in=[n for n, _ in ESPECIALIDADES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_alter_solicitacaocadastro_estado_civil'),
    ]

    operations = [
        migrations.RunPython(carregar, desfazer),
    ]
