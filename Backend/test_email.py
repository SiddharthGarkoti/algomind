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

def test_email_services(recipient=None):
    brevo_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    brevo_sender = getattr(settings, 'BREVO_SENDER_EMAIL', 'AlgoMind.Support@gmail.com')
    user = getattr(settings, 'EMAIL_HOST_USER', '')
    pwd = getattr(settings, 'EMAIL_HOST_PASSWORD', '')

    target = recipient or "algomind.support@gmail.com"

    print("=" * 60)
    print("AlgoMind Email Configuration Diagnostic")
    print("=" * 60)
    print(f"PRIMARY MODE (Brevo REST API):  {'CONFIGURED (Active)' if brevo_key else 'NOT CONFIGURED'}")
    print(f"Brevo Sender:                   {brevo_sender}")
    print(f"SECONDARY MODE (Gmail SMTP):    {user or '(not set)'} via {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
    print("=" * 60)

    if brevo_key:
        print(f"\n[1] Testing PRIMARY Email Mode: Brevo REST API (HTTPS port 443)...")
        try:
            import requests
            payload = {
                "sender": {"name": "AlgoMind", "email": brevo_sender},
                "to": [{"email": target}],
                "subject": "AlgoMind Brevo Test — Success!",
                "htmlContent": "<h2 style='color:#6366f1;'>AlgoMind Email Service Working!</h2><p>This email confirms Brevo is active as your primary email engine.</p>",
                "textContent": "AlgoMind Email Service Working! This email confirms Brevo is active as your primary email engine."
            }
            resp = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                json=payload,
                headers={"api-key": brevo_key, "Content-Type": "application/json"},
                timeout=10
            )
            if resp.status_code in (200, 201):
                print(f"[OK] BREVO SUCCESS! Live test email sent to {target} (Status: {resp.status_code})")
                print(f"Message ID: {resp.json().get('messageId')}")
                return
            else:
                print(f"[WARN] Brevo returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[WARN] Brevo exception: {e}")

    print(f"\n[2] Testing SECONDARY Fallback Mode: Gmail SMTP...")
    try:
        send_mail(
            subject="AlgoMind SMTP Test — Success",
            message="Congratulations! Your AlgoMind email delivery system is working perfectly.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[target],
            fail_silently=False,
        )
        print(f"[OK] SMTP SUCCESS: Test email delivered to {target}!")
    except Exception as e:
        print(f"[ERROR] SMTP Failed: {e}")

if __name__ == '__main__':
    recipient = sys.argv[1] if len(sys.argv) > 1 else None
    test_email_services(recipient)
