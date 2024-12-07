import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Pharmashop title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Pharmashop/i);
  expect(titleElement).toBeInTheDocument();
});
