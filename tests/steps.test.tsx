import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Steps, ThemeProvider } from '../src';

it('a route change updates the current step without hiding completed or optional links', () => {
  const items = [
    { value: 'first', href: '/first', label: '采集', status: '完成' },
    { value: 'second', href: '/second', label: '复核', optional: true },
  ];
  const view = (currentValue: string) => (
    <ThemeProvider>
      <Steps label="配置步骤" items={items} currentValue={currentValue} />
    </ThemeProvider>
  );
  const { rerender } = render(view('first'));
  expect(screen.getByRole('link', { name: /采集.*完成/ })).toHaveAttribute('aria-current', 'step');
  rerender(view('second'));
  expect(screen.getByRole('link', { name: /采集.*完成/ })).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('link', { name: /复核.*可选/ })).toHaveAttribute('aria-current', 'step');
  expect(screen.getByRole('link', { name: /采集.*完成/ })).toHaveAttribute('href', '/first');
});

it('a custom router link keeps its handler and route semantics through Button asChild', () => {
  const navigate = vi.fn();
  render(
    <ThemeProvider>
      <Steps
        label="配置步骤"
        currentValue="first"
        items={[{ value: 'first', href: '/first', label: '采集' }]}
        renderLink={(props) => (
          <a
            {...props}
            onClick={(event) => {
              event.preventDefault();
              navigate(props.href);
            }}
          />
        )}
      />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByRole('link', { name: '采集' }));
  expect(navigate).toHaveBeenCalledWith('/first');
  expect(screen.getByRole('link', { name: '采集' })).toHaveAttribute('aria-current', 'step');
});

