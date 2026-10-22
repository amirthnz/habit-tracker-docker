from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_add_user_scoping'),
    ]

    operations = [
        migrations.RenameField(
            model_name='prize',
            old_name='trophy_cost',
            new_name='ticket_cost',
        ),
        migrations.RenameField(
            model_name='prizeredemption',
            old_name='trophy_cost',
            new_name='ticket_cost',
        ),
    ]
