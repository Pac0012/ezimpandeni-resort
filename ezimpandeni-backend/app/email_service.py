import os
import smtplib
from email.message import EmailMessage


def _strip_quotes(value: str) -> str:
    return value.strip().strip('"').strip("'")


def send_otp_email(
        to_email: str,
        otp_code: str,
        app_name: str = "Ezimpandeni Staff Portal",
) -> None:
    """Sends a 6-digit OTP code via SMTP using MAIL_* variables from .env."""
    mail_server = _strip_quotes(os.getenv("MAIL_SERVER", "smtp.gmail.com"))
    mail_port = int(_strip_quotes(os.getenv("MAIL_PORT", "587")))
    mail_username = _strip_quotes(os.getenv("MAIL_USERNAME", ""))
    mail_password = _strip_quotes(os.getenv("MAIL_PASSWORD", ""))
    mail_from = _strip_quotes(os.getenv("MAIL_FROM", mail_username))

    if not mail_username or not mail_password or mail_password == "your-google-app-password":
        raise RuntimeError(
            "MAIL_USERNAME or a valid MAIL_PASSWORD (Google App Password) is missing in .env."
        )

    msg = EmailMessage()
    msg["Subject"] = f"{app_name} - Your Verification Code"
    msg["From"] = mail_from or mail_username
    msg["To"] = to_email
    msg.set_content(
        f"Your {app_name} verification code is: {otp_code}\n\n"
        f"This code expires in 5 minutes."
    )
    msg.add_alternative(
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="margin-top: 0;">{app_name}</h2>
            <p>Use the verification code below to complete your sign-in:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 14px; background: #f4f4f4; text-align: center; border-radius: 6px; margin: 16px 0;">
                {otp_code}
            </div>
            <p style="color: #555; font-size: 13px;">This code expires in <strong>5 minutes</strong>.</p>
        </div>
        """,
        subtype="html",
    )

    with smtplib.SMTP(mail_server, mail_port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(mail_username, mail_password)
        server.send_message(msg)