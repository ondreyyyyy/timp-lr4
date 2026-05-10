import { render, screen } from '@testing-library/react';
import App from './App';

test('Рендеринг страницы 404 при переходе на несуществующий маршрут', () => {
  window.history.pushState({}, 'Test page', '/this-route-does-not-exist');
  render(<App />);
  const notFoundElement = screen.getByText(/404 - Страница не найдена/i);
  expect(notFoundElement).toBeInTheDocument();
});
