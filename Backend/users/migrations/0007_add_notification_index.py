from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_user_last_active_datetime'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', 'read'], name='users_notification_recipient_read_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', '-created_at'], name='users_notification_recipient_created_idx'),
        ),
    ]
