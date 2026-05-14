# timp-lr4

## SMTP для 2FA

Для двухфакторного входа по email заполните в `backend/.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_USE_TLS`/`SMTP_USE_SSL`
- `TWO_FACTOR_CODE_EXPIRE_MINUTES`
