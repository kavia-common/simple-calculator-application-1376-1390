import { render, screen } from '@testing-library/react';
import App from './App';

test('renders calculator display', () => {
  render(<App />);
  // The calculator main display should show the initial value "0"
  const display = screen.getByLabelText(/display/i);
  expect(display).toBeInTheDocument();
  expect(display).toHaveTextContent('0');
});

test('renders calculator buttons', () => {
  render(<App />);
  // The button grid should be present
  const buttonGroup = screen.getByRole('group', { name: /calculator buttons/i });
  expect(buttonGroup).toBeInTheDocument();
});
