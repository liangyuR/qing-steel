import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControllable } from '../src/core';
import { timeOptions } from '../src/internal/time-options';
import { AnimatedNumber, Table } from '../src';

describe('更新边界与兼容性', () => {
  it('稳定回调仍使用最新受控值与最新处理器', () => {
    const first = vi.fn(),
      next = vi.fn();
    const setters: unknown[] = [];
    function Demo({ value, callback }: { value?: number; callback: (n: number) => void }) {
      const [n, set] = useControllable(value, 0, callback);
      setters.push(set);
      return <button onClick={() => set(n + 1)}>{n}</button>;
    }
    const { rerender } = render(<Demo value={1} callback={first} />);
    rerender(<Demo value={7} callback={next} />);
    fireEvent.click(screen.getByRole('button'));
    expect(next).toHaveBeenCalledWith(8);
    expect(first).not.toHaveBeenCalled();
    expect(new Set(setters).size).toBe(1);
  });
  it('选择一行只重绘该行，外部更新行数据仍正确刷新', () => {
    const cell = vi.fn((row: { id: string; value: string }) => row.value);
    const columns = [{ key: 'value', header: '值', render: cell }];
    const rows = [
      { id: 'a', value: 'A' },
      { id: 'b', value: 'B' },
    ];
    const key = (row: { id: string }) => row.id;
    const { rerender } = render(
      <Table caption="数据" rows={rows} columns={columns} rowKey={key} selectable />,
    );
    cell.mockClear();
    fireEvent.click(screen.getByRole('checkbox', { name: '选择 a' }));
    expect(cell).toHaveBeenCalledTimes(1);
    rerender(
      <Table
        caption="数据"
        rows={[rows[0], { id: 'b', value: '新值' }]}
        columns={columns}
        rowKey={key}
        selectable
      />,
    );
    expect(screen.getByText('新值')).toBeVisible();
  });
  it('数字流更新取消旧动画，不反复淡出；卸载时清理动画', () => {
    const original = HTMLElement.prototype.animate;
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation);
    HTMLElement.prototype.animate = animate;
    try {
      const { container, rerender, unmount } = render(<AnimatedNumber value={1.01} />);
      container.querySelectorAll<HTMLElement>('.qs-reading-character > span').forEach((el) => {
        el.style.setProperty('--dur-short', '120ms');
        el.style.setProperty('--dur-medium', '240ms');
      });
      rerender(<AnimatedNumber value={1.02} />);
      rerender(<AnimatedNumber value={1.03} />);
      expect(animate).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalled();
      expect(container).toHaveTextContent('1.03');
      unmount();
    } finally {
      HTMLElement.prototype.animate = original;
    }
  });
});

describe('时间选项按步长计算', () => {
  for (const [min, max, base, step] of [
    [0, 86399, 0, 60],
    [28800, 64800, 28800, 900],
    [79200, 7200, 79200, 60],
    [0, 86399, 15, 60],
    [0, 100, 0.5, 1.5],
    [0, 100, 0.1, 0.3],
    [10, 10, 10, 1],
  ]) {
    it(`范围 ${min}–${max}，基准 ${base}，步长 ${step}`, () => {
      const expected = Array.from({ length: 86400 }, (_, n) => n).filter(
        (n) =>
          (min <= max ? n >= min && n <= max : n >= min || n <= max) &&
          Math.abs((n - base) / step - Math.round((n - base) / step)) < 1e-7,
      );
      const actual = timeOptions(min, max, base, step);
      expect(actual.slots).toEqual(expected);
      expect([...actual.hours.values()].flat()).toEqual(expected);
      expect([...actual.minutes.values()].flat()).toEqual(expected);
    });
  }
});
