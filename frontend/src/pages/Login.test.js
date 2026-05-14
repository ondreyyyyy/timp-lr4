import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
const mockPost = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../api/axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => mockPost(...args),
  },
}));

describe('Login 2FA flow', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPost.mockReset();
    localStorage.clear();
  });

  test('shows 2FA code form after successful credentials check', async () => {
    mockPost.mockResolvedValueOnce({
      data: { two_factor_required: true, login: 'guard', detail: 'Код отправлен' },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'guard' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Код из email')).toBeInTheDocument();
      expect(screen.getByText('Код отправлен')).toBeInTheDocument();
    });
  });

  test('shows invalid credentials error', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'guard' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument();
    });
  });

  test('completes 2FA verification and navigates to incidents', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { two_factor_required: true, login: 'guard', detail: 'Код отправлен' } })
      .mockResolvedValueOnce({ data: { access_token: 'token-123' } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'guard' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(screen.getByPlaceholderText('Код из email')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Код из email'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить вход' }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('token-123');
      expect(mockNavigate).toHaveBeenCalledWith('/incidents');
    });
  });
});
