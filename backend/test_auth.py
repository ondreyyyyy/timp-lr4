from auth import get_password_hash, verify_password, generate_2fa_code

def test_password_hashing():
    password = "super_secret_password_123"
    hashed = get_password_hash(password)
    assert password != hashed
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_generate_2fa_code_format():
    code = generate_2fa_code()
    assert len(code) == 6
    assert code.isdigit()
