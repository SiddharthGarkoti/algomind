from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0004_completedplan_verifiedproblem'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='topicstats',
            index=models.Index(fields=['profile', 'topic_slug'], name='analytics_topicstats_profile_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='platformprofile',
            index=models.Index(fields=['user', 'platform_name'], name='analytics_platformprofile_user_platform_idx'),
        ),
    ]
