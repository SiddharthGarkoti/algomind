from django.core.management.base import BaseCommand
from analytics.sync_tasks import sync_inactive_users_daily


class Command(BaseCommand):
    help = 'Automatically syncs LeetCode and platform profiles once a day for users who have not logged in.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync even if already run today or user logged in today',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        self.stdout.write(self.style.NOTICE(f"Starting daily LeetCode/platform profile sync (force={force})..."))
        res = sync_inactive_users_daily(force=force)
        self.stdout.write(self.style.SUCCESS(
            f"Daily sync completed: {res['status']}. Updated {res.get('synced_count', 0)} inactive users. "
            f"Skipped {res.get('skipped_count', 0)}."
        ))
