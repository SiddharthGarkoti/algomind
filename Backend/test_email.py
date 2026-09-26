"""
AlgoMind — Email & SMTP Configuration Diagnostic Tool
Run: python test_email.py [recipient_email]
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

def test_smtp(recipient=None):
    user = getattr(settings, 'EMAIL_HOST_USER', '')
    pwd = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    backend = getattr(settings, 'EMAIL_BACKEND', '')
    is_dummy = getattr(settings, 'IS_DUMMY_EMAIL', True)

    print("=" * 60)
    print("AlgoMind Email Configuration Diagnostic")
    print("=" * 60)
    print(f"EMAIL_HOST:          {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
    print(f"EMAIL_HOST_USER:     {user or '(not set)'}")
    print(f"EMAIL_HOST_PASSWORD: {'********' if pwd and not is_dummy else pwd or '(not set)'}")
    print(f"EMAIL_BACKEND:       {backend}")
    print(f"IS_DUMMY_EMAIL:      {is_dummy}")
    print("=" * 60)

    if is_dummy:
        print("\n[!] CURRENT STATUS: SAFE DEV / CONSOLE MODE")
        print("Real emails are currently paused because EMAIL_HOST_PASSWORD is a placeholder.")
        print("\nTo enable real email sending via Gmail:")
        print("  1. Go to: https://myaccount.google.com/apppasswords")
        print("  2. Generate an App Password named 'AlgoMind'")
        print("  3. Paste the 16-character password into Backend/.env:")
        print("     EMAIL_HOST_PASSWORD=abcdefghijklmnop")
        print("  4. Re-run this script to verify delivery.")
        return

    target = recipient or user
    print(f"\nAttempting to send live test email to {target} via {settings.EMAIL_HOST}...")

    try:
        send_mail(
            subject="AlgoMind SMTP Test — Success",
            message="Congratulations! Your AlgoMind email delivery system is working perfectly.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[target],
            fail_silently=False,
        )
        print(f"\n[OK] SUCCESS: Test email delivered to {target}!")
    except Exception as e:
        print(f"\n[ERROR] FAILED TO SEND EMAIL: {e}")
        print("\nCommon fixes:")
        print(" - Make sure 2-Step Verification is ON in your Google Account.")
        print(" - Make sure you are using a 16-character Google 'App Password', not your normal account password.")
        print(" - Verify EMAIL_HOST_USER matches the Google account.")

if __name__ == '__main__':
    recipient = sys.argv[1] if len(sys.argv) > 1 else None
    test_smtp(recipient)
