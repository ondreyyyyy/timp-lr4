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
});
