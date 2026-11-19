from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['receiver', 'read'], name='chat_msg_receiver_read_idx'),
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['sender', 'receiver', 'created_at'], name='chat_msg_convo_idx'),
        ),
    ]
