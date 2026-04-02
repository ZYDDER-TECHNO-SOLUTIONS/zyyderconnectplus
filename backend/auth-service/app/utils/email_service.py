import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from app.config import settings


def _build_welcome_html(full_name: str, email: str, password: str, role: str) -> str:
    role_label = "Job Seeker" if role == "employee" else "Employer" if role == "employer" else "Administrator"
    role_color = "#6366f1" if role == "employee" else "#059669" if role == "employer" else "#dc2626"

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px 40px 30px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:12px;text-align:center;vertical-align:middle;">
                    <span style="font-size:20px;">&#10024;</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Sparklex Connect+</span>
                  </td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:16px 0 0;">AI-Powered Job Portal</p>
            </td>
          </tr>

          <!-- Welcome Section -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <h1 style="color:#1e293b;font-size:26px;font-weight:700;margin:0 0 8px;">Welcome aboard, {full_name}! &#127881;</h1>
              <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0;">
                Your account has been successfully created. You're now part of the Sparklex Connect+ community.
              </p>
            </td>
          </tr>

          <!-- Account Details Card -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:24px;">
                    <p style="color:#6366f1;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Account Details</p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:13px;width:100px;">Email</td>
                        <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">{email}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Password</td>
                        <td style="padding:8px 0;border-top:1px solid #e2e8f0;">
                          <code style="background:#6366f1;color:#ffffff;padding:4px 12px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px;">{password}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Role</td>
                        <td style="padding:8px 0;border-top:1px solid #e2e8f0;">
                          <span style="background:{role_color};color:#ffffff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">{role_label}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border-radius:12px;border:1px solid #fbbf24;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                      &#128274; <strong>Security Tip:</strong> We recommend changing your password after your first login for enhanced security.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="http://connect.qhrmpro.com:30001/login" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                Sign In to Your Account &#8594;
              </a>
            </td>
          </tr>

          <!-- What's Next Section -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 16px;">What you can do next:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                {"".join(f'''
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:30px;">
                    <span style="display:inline-block;width:24px;height:24px;background:#ede9fe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;color:#6366f1;font-weight:700;">{i}</span>
                  </td>
                  <td style="padding:10px 0 10px 12px;">
                    <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">{title}</p>
                    <p style="color:#64748b;font-size:13px;margin:4px 0 0;">{desc}</p>
                  </td>
                </tr>
                ''' for i, title, desc in (
                    (1, "Complete your profile", "Add your phone number and other details"),
                    (2, "Upload your resume" if role == "employee" else "Post your first job", "Let our AI analyze your skills" if role == "employee" else "Start attracting top talent"),
                    (3, "Build a resume" if role == "employee" else "Review applications", "Use our professional resume builder" if role == "employee" else "AI-powered candidate matching"),
                ))}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">
                &copy; 2026 Sparklex Connect+. All rights reserved.
              </p>
              <p style="color:#cbd5e1;font-size:11px;margin:0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _send_email_sync(to_email: str, subject: str, html_body: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"SMTP not configured, skipping email to {to_email}")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Sparklex Connect+ <{settings.SMTP_FROM or settings.SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.send_message(msg)
    print(f"Email sent to {to_email}")


def _build_reset_html(full_name: str, reset_code: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:32px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;">Sparklex Connect+</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="color:#1e293b;font-size:22px;font-weight:700;margin:0 0 12px;">Reset Your Password</h1>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hi {full_name}, we received a request to reset your password. Use the code below to set a new password.
            </p>

            <!-- Reset Code -->
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;background:#f8fafc;border:2px dashed #6366f1;border-radius:12px;padding:20px 40px;">
                <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:600;">Your Reset Code</p>
                <p style="color:#6366f1;font-size:32px;font-weight:700;letter-spacing:6px;margin:0;font-family:monospace;">{reset_code}</p>
              </div>
            </div>

            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">
              This code expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>

            <!-- Security Warning -->
            <div style="background:#fef3c7;border-radius:10px;border:1px solid #fbbf24;padding:14px 18px;margin:24px 0 0;">
              <p style="color:#92400e;font-size:12px;margin:0;line-height:1.5;">
                &#128274; <strong>Security Tip:</strong> Never share this code with anyone. Our team will never ask you for this code.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; 2026 Sparklex Connect+. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_reset_email(full_name: str, email: str, reset_code: str):
    html = _build_reset_html(full_name, reset_code)
    subject = "Password Reset - Sparklex Connect+"
    try:
        await asyncio.to_thread(_send_email_sync, email, subject, html)
    except Exception as e:
        print(f"Failed to send reset email to {email}: {e}")


async def send_welcome_email(full_name: str, email: str, password: str, role: str):
    html = _build_welcome_html(full_name, email, password, role)
    subject = f"Welcome to Sparklex Connect+, {full_name}!"
    try:
        await asyncio.to_thread(_send_email_sync, email, subject, html)
    except Exception as e:
        print(f"Failed to send welcome email to {email}: {e}")
