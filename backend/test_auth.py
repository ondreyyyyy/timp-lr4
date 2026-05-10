from auth import get_password_hash, verify_password

def test_password_hashing():
    password = "super_secret_password_123"
    hashed = get_password_hash(password)
    assert password != hashed
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False
