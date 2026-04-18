# Migration: 0006_user_last_active_datetime
# Upgrades last_active from DateField → DateTimeField.
# Existing date values are converted to midnight UTC to preserve streak history.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_plan_tier'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='last_active',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text='Last time this user loaded a page on AlgoMind. Used for 5-minute online-presence detection.'
            ),
        ),
    ]
