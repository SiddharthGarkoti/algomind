from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PlatformProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform_name', models.CharField(choices=[('leetcode', 'LeetCode'), ('codeforces', 'Codeforces'), ('codechef', 'CodeChef'), ('hackerrank', 'HackerRank')], max_length=20)),
                ('handle', models.CharField(max_length=100)),
                ('connected_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='platform_profiles', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'platform_name')},
            },
        ),
        migrations.CreateModel(
            name='PlatformStats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField(default=0)),
                ('problems_solved', models.PositiveIntegerField(default=0)),
                ('contests', models.PositiveIntegerField(default=0)),
                ('easy_solved', models.PositiveIntegerField(default=0)),
                ('medium_solved', models.PositiveIntegerField(default=0)),
                ('hard_solved', models.PositiveIntegerField(default=0)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='stats', to='analytics.platformprofile')),
            ],
        ),
        migrations.CreateModel(
            name='TopicStats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('topic_name', models.CharField(max_length=100)),
                ('topic_slug', models.CharField(max_length=100)),
                ('problems_solved', models.PositiveIntegerField(default=0)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='topic_stats', to='analytics.platformprofile')),
            ],
            options={
                'ordering': ['-problems_solved'],
                'unique_together': {('profile', 'topic_slug')},
            },
        ),
    ]
