import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Accordion,
  Autocomplete,
  Button,
  NavigationDrawer,
  Pagination,
  Popover,
  Slider,
  Table,
  TextField,
  ThemeProvider,
  Toolbar,
  type TableColumn,
} from '../src';

describe('高级输入', () => {
  it('受控范围滑块调整 → 输出保持双值且回传步长正确', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [range, setRange] = useState<[number, number]>([20, 75]);
      return (
        <>
          <Slider range label="范围" value={range} onValueChange={setRange} step={5} />
          <p>{range.join(' / ')}</p>
        </>
      );
    }
    render(<Demo />);
    screen.getByRole('slider', { name: '范围下限' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('25 / 75')).toBeVisible();
    expect(screen.getByRole('slider', { name: '范围上限' })).toHaveAttribute('aria-valuenow', '75');
  });
  it('搜索后用键盘确认 → 跳过禁用建议，提交选项值而不是显示文字', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <form aria-label="设备表单">
          <Autocomplete
            name="device"
            label="设备"
            required
            options={[
              { value: 'offline', label: 'A 离线', disabled: true },
              { value: 'online', label: 'A 在线' },
            ]}
          />
        </form>
      </ThemeProvider>,
    );
    const input = screen.getByRole('combobox', { name: '设备' });
    await user.type(input, 'A');
    expect(input).toBeInvalid();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue('A 在线');
    expect(input).toBeValid();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('device')).toBe('online');
    await user.type(input, '未知');
    await user.tab();
    expect(input).toHaveValue('');
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('device')).toBe('');
  });
  it('异步选项替换旧建议 → 不确认失效的高亮，加载完才能选择新结果', async () => {
    const user = userEvent.setup();
    const onValueChange: string[] = [];
    const view = (options: { value: string; label: string }[], loading = false) => (
      <ThemeProvider>
        <Autocomplete
          label="远程搜索"
          options={options}
          loading={loading}
          filterOptions={false}
          onValueChange={(value) => onValueChange.push(value)}
        />
      </ThemeProvider>
    );
    const { rerender } = render(view([{ value: 'old', label: '旧结果' }]));
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    rerender(view([{ value: 'old', label: '旧结果' }], true));
    await user.keyboard('{Enter}');
    expect(onValueChange).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent('正在加载');
    rerender(view([{ value: 'new', label: '新结果' }]));
    await user.keyboard('{Enter}');
    expect(onValueChange).toEqual([]);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('combobox')).toHaveValue('新结果');
    expect(onValueChange).toEqual(['new']);
  });
});
type Row = { id: string; value: number; locked?: boolean };
const columns: TableColumn<Row>[] = [
  { key: 'id', header: '编号', accessor: (row) => row.id },
  { key: 'value', header: '数值', accessor: (row) => row.value, align: 'right', sortable: true },
];
describe('表格与分页', () => {
  it('点击数值表头 → 数字升降序正确，第三次恢复原始顺序且不修改数据', async () => {
    const user = userEvent.setup();
    const rows = [
      { id: 'a', value: 10 },
      { id: 'b', value: 2 },
      { id: 'c', value: 30 },
    ];
    render(<Table caption="数据" rows={rows} columns={columns} rowKey={(row) => row.id} />);
    const order = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell')[0].textContent);
    await user.click(screen.getByRole('button', { name: '数值' }));
    expect(order()).toEqual(['b', 'a', 'c']);
    await user.click(screen.getByRole('button', { name: '数值' }));
    expect(order()).toEqual(['c', 'a', 'b']);
    await user.click(screen.getByRole('button', { name: '数值' }));
    expect(order()).toEqual(['a', 'b', 'c']);
    expect(rows.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });
  it('跨页全选和取消 → 仅改变本页可选行，保留其他页的选择', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [page, setPage] = useState(1);
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <>
          <Button onClick={() => setPage(page === 1 ? 2 : 1)}>换页</Button>
          <Table
            caption="选择"
            columns={columns}
            rows={
              page === 1
                ? [{ id: 'a', value: 1 }]
                : [
                    { id: 'b', value: 2 },
                    { id: 'c', value: 3, locked: true },
                  ]
            }
            rowKey={(row) => row.id}
            selectable
            isRowSelectable={(row) => !row.locked}
            selectedKeys={selection}
            onSelectionChange={setSelection}
          />
          <p>已选：{selection.join(',')}</p>
        </>
      );
    }
    render(<Demo />);
    await user.click(screen.getByRole('checkbox', { name: '选择本页全部' }));
    await user.click(screen.getByRole('button', { name: '换页' }));
    await user.click(screen.getByRole('checkbox', { name: '选择本页全部' }));
    expect(screen.getByText('已选：a,b')).toBeVisible();
    expect(screen.getByRole('checkbox', { name: '选择 c' })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: '选择本页全部' }));
    expect(screen.getByText('已选：a')).toBeVisible();
  });
  it('改变每页条数和清空数据 → 回到第一页，空数据禁用翻页并显示零条', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Pagination total={35} defaultPage={3} defaultPageSize={10} />);
    await user.click(screen.getByRole('combobox', { name: '每页条数' }));
    await user.click(screen.getByRole('option', { name: '20 条 / 页' }));
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText(/1–20 \/ 共 35 条/)).toBeVisible();
    rerender(<Pagination total={0} defaultPage={3} defaultPageSize={10} />);
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
    expect(screen.getByText(/0 \/ 共 0 条/)).toBeVisible();
  });
});
describe('导航与内容', () => {
  it('导航收起后切换 → 当前项和可访问名称保留，禁用项不能选中', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <NavigationDrawer
          label="主导航"
          defaultValue="one"
          items={[
            { value: 'one', label: '概览', icon: '◇' },
            { value: 'two', label: '记录', icon: '▤' },
            { value: 'three', label: '禁用设置', icon: '×', disabled: true },
          ]}
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: '收起导航' }));
    await user.click(screen.getByRole('button', { name: '记录' }));
    expect(screen.getByRole('button', { name: '记录' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: '禁用设置' }));
    expect(screen.getByRole('button', { name: '记录' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: '展开导航' }));
    expect(screen.getByRole('button', { name: '记录' })).toHaveAttribute('aria-current', 'page');
  });
  it('工具栏方向键 → 跳过禁用操作，不拦截输入框的方向键', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar label="编辑">
        <Button>新增</Button>
        <Button disabled>不可用</Button>
        <Button>刷新</Button>
        <TextField aria-label="筛选" />
      </Toolbar>,
    );
    screen.getByRole('button', { name: '新增' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '刷新' })).toHaveFocus();
    screen.getByRole('textbox').focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
  it('多项展开受控折叠面板 → 关闭一项不改变另一项', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [value, setValue] = useState(['one', 'two']);
      return (
        <Accordion
          multiple
          value={value}
          onValueChange={setValue}
          items={[
            { value: 'one', title: '第一项', content: '内容一' },
            { value: 'two', title: '第二项', content: '内容二' },
          ]}
        />
      );
    }
    render(<Demo />);
    await user.click(screen.getByRole('button', { name: '第一项' }));
    expect(screen.getByRole('button', { name: '第一项' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: '第二项' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('内容二')).toBeVisible();
  });
  it('编辑锚点浮层并 Escape 关闭 → 局部主题继承且焦点回到触发按钮', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <Popover title="编辑参数" trigger={<Button>参数</Button>}>
          <TextField label="名称" />
        </Popover>
      </ThemeProvider>,
    );
    const trigger = screen.getByRole('button', { name: '参数' });
    await user.click(trigger);
    const popup = screen.getByRole('dialog', { name: '编辑参数' });
    expect(popup.closest('.qs-scheme-light')).not.toBeNull();
    await user.type(screen.getByRole('textbox', { name: '名称' }), '新名称');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
