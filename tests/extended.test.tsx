import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Accordion,
  Autocomplete,
  Button,
  NavigationDrawer,
  NavigationRail,
  Pagination,
  Popover,
  Slider,
  Table,
  TextField,
  ThemeProvider,
  Toolbar,
  type NavigationLinkProps,
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
  it('行内编辑与选择 → 只有点击行本身或聚焦行后回车才触发行操作', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    type Limit = { id: string; value: number };
    const editable: TableColumn<Limit>[] = [
      { key: 'id', header: '编号', accessor: (row) => row.id },
      {
        key: 'value',
        header: '数值',
        render: (row) => <TextField aria-label={`${row.id} 数值`} defaultValue={row.value} />,
      },
    ];
    render(
      <Table
        caption="限值"
        rows={[
          { id: 'a', value: 1 },
          { id: 'b', value: 2 },
        ]}
        columns={editable}
        rowKey={(row) => row.id}
        selectable
        getRowProps={(row) => ({
          tabIndex: 0,
          'aria-label': `打开 ${row.id}`,
          onClick: () => opened.push(row.id),
        })}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'a 数值' });
    await user.click(input);
    await user.keyboard('{Enter} 3');
    await user.click(screen.getByRole('checkbox', { name: '选择 a' }));
    expect(opened).toEqual([]);
    expect(input).toHaveValue('1 3');
    await user.click(within(screen.getByRole('row', { name: '打开 b' })).getByText('b'));
    screen.getByRole('row', { name: '打开 a' }).focus();
    await user.keyboard('{Enter}');
    expect(opened).toEqual(['b', 'a']);
  });
  it('点击选择列单元格的留白 → 不触发行操作，也不改变勾选', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    render(
      <Table
        caption="限值"
        rows={[{ id: 'a' }]}
        columns={[{ key: 'id', header: '编号', accessor: (row) => row.id }]}
        rowKey={(row) => row.id}
        selectable
        getRowProps={(row) => ({ onClick: () => opened.push(row.id) })}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: '选择 a' });
    await user.click(checkbox.closest('td') as HTMLElement);
    expect(opened).toEqual([]);
    expect(checkbox).not.toBeChecked();
    await user.click(screen.getByText('a'));
    expect(opened).toEqual(['a']);
  });
  it('单元格跨列 → 被覆盖的后续列不渲染，行头使用 th scope=row', () => {
    type Limit = { id: string; off?: boolean };
    render(
      <Table<Limit>
        caption="判定项"
        rows={[{ id: '位置' }, { id: '胶宽', off: true }]}
        rowKey={(row) => row.id}
        columns={[
          { key: 'name', header: '判定项', accessor: (row) => row.id, rowHeader: true },
          {
            key: 'lower',
            header: '下限',
            accessor: (row) => (row.off ? '不判' : '0.5'),
            colSpan: (row) => (row.off ? 5 : undefined),
          },
          { key: 'upper', header: '上限', accessor: () => '0.8' },
          { key: 'band', header: '区间', accessor: () => '0.5 ~ 0.8' },
        ]}
      />,
    );
    const [, on, off] = screen.getAllByRole('row');
    expect(within(on).getByRole('rowheader', { name: '位置' })).toHaveAttribute('scope', 'row');
    expect(
      within(on)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['0.5', '0.8', '0.5 ~ 0.8']);
    const cells = within(off).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toEqual(['不判']);
    expect(cells[0]).toHaveAttribute('colspan', '3');
  });
  it.each([
    { keep: false, stale: [] as string[], message: true },
    { keep: true, stale: ['a', 'b'], message: false },
  ])(
    '重新加载且行数据清空 → keepRowsWhileLoading=$keep 时显示 $stale 行',
    ({ keep, stale, message }) => {
      const view = (rows: Row[], loading: boolean) => (
        <Table
          caption="数据"
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={loading}
          keepRowsWhileLoading={keep}
        />
      );
      const { rerender } = render(
        view(
          [
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
          ],
          false,
        ),
      );
      rerender(view([], true));
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
      expect(
        screen
          .queryAllByRole('row')
          .slice(1)
          .map((row) => within(row).queryAllByRole('cell')[0]?.textContent)
          .filter((text) => text === 'a' || text === 'b'),
      ).toEqual(stale);
      expect(screen.queryByText('正在加载数据…') !== null).toBe(message);
      rerender(view([{ id: 'c', value: 3 }], false));
      expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
      expect(screen.getByRole('cell', { name: 'c' })).toBeVisible();
    },
  );
  it('固定页大小 → showPageSize=false 时不渲染每页条数选择', () => {
    render(<Pagination total={120} pageSize={30} showPageSize={false} />);
    expect(screen.queryByRole('combobox', { name: '每页条数' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第 4 页' })).toBeVisible();
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
  it('renderLink 交给宿主链接 → 链接收到地址、当前项与选中回调，禁用项仍为按钮', async () => {
    const user = userEvent.setup();
    const visits: string[] = [];
    function RouterLink({ href, onClick, ...props }: NavigationLinkProps) {
      return (
        <a
          {...props}
          href={`/app${href}`}
          onClick={(event) => {
            event.preventDefault();
            visits.push(href);
            onClick(event);
          }}
        />
      );
    }
    render(
      <ThemeProvider>
        <NavigationRail
          label="主导航"
          defaultValue="/a"
          renderLink={(props) => <RouterLink {...props} />}
          items={[
            { value: '/a', href: '/a', label: '概览', icon: '◇' },
            { value: '/b', href: '/b', label: '记录', icon: '▤' },
            { value: '/c', href: '/c', label: '锁定', icon: '×', disabled: true },
          ]}
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('link', { name: '记录' }));
    expect(visits).toEqual(['/b']);
    expect(screen.getByRole('link', { name: '记录' })).toHaveAttribute('href', '/app/b');
    expect(screen.getByRole('link', { name: '记录' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '锁定' })).toBeDisabled();
  });
  it('分组导航收起 → 每组仍是以组名命名的 group，未分组项不在组内', () => {
    render(
      <ThemeProvider>
        <NavigationDrawer
          label="主导航"
          defaultCollapsed
          items={[
            { value: 'guide', label: '总览', icon: '□' },
            { value: 'inspect', label: '在线检测', icon: '◇', group: '生产' },
            { value: 'history', label: '历史记录', icon: '▤', group: '生产' },
            { value: 'camera', label: '相机', icon: '○', group: '设备' },
          ]}
        />
      </ThemeProvider>,
    );
    const [inspect, history, ...rest] = within(
      screen.getByRole('group', { name: '生产' }),
    ).getAllByRole('button');
    expect(inspect).toHaveAccessibleName('在线检测');
    expect(history).toHaveAccessibleName('历史记录');
    expect(rest).toEqual([]);
    expect(
      within(screen.getByRole('group', { name: '设备' })).getByRole('button', { name: '相机' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '总览' }).closest('[role="group"]')).toBeNull();
  });
  it('点击底部导航项 → 与主列表共用选中值，只有它是当前项', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <NavigationDrawer
          label="主导航"
          defaultValue="guide"
          items={[{ value: 'guide', label: '总览', icon: '□' }]}
          footerItems={[{ value: 'settings', label: '系统设置', icon: '⚙' }]}
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: '系统设置' }));
    const current = screen.getAllByRole('button', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName('系统设置');
  });
  it('自定义收起展开名称 → 切换按钮名称与展开状态随请求切换', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <NavigationDrawer
          label="主导航"
          items={[{ value: 'guide', label: '总览', icon: '□' }]}
          expandLabel="展开侧边栏"
          collapseLabel="折叠侧边栏"
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: '折叠侧边栏' }));
    expect(screen.getByRole('button', { name: '展开侧边栏' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
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
  it.each([
    { forceMount: false, after: '' },
    { forceMount: true, after: '未保存' },
  ])('折叠后再展开 → forceMount=$forceMount 时输入值为 "$after"', async ({ forceMount, after }) => {
    const user = userEvent.setup();
    render(
      <Accordion
        forceMount={forceMount}
        defaultValue="debug"
        items={[{ value: 'debug', title: '高级参数', content: <TextField aria-label="备注" /> }]}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: '备注' }), '未保存');
    await user.click(screen.getByRole('button', { name: '高级参数' }));
    const region = document.getElementById(
      screen.getByRole('button', { name: '高级参数' }).getAttribute('aria-controls')!,
    )!;
    expect(region).toHaveAttribute('inert');
    await waitFor(() => expect(region).not.toBeVisible());
    expect(within(region).queryAllByRole('textbox', { hidden: true })).toHaveLength(
      forceMount ? 1 : 0,
    );
    await user.click(screen.getByRole('button', { name: '高级参数' }));
    expect(region).not.toHaveAttribute('inert');
    expect(screen.getByRole('textbox', { name: '备注' })).toHaveValue(after);
  });
  it.each([false, true])(
    '放在 fieldset disabled 内 → ignoreFieldsetDisabled=%s 决定标题能否展开，内容控件保持禁用',
    async (ignoreFieldsetDisabled) => {
      const user = userEvent.setup();
      render(
        <fieldset disabled>
          <Accordion
            ignoreFieldsetDisabled={ignoreFieldsetDisabled}
            items={[{ value: 'gain', title: '增益', content: <TextField aria-label="增益值" /> }]}
          />
        </fieldset>,
      );
      const trigger = screen.getByRole('button', { name: '增益' });
      if (!ignoreFieldsetDisabled) {
        expect(trigger).toBeDisabled();
        return;
      }
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('textbox', { name: '增益值' })).toBeDisabled();
      fireEvent.keyDown(trigger, { key: ' ' });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    },
  );
  it('上下文帮助键盘聚焦 → 打开 tooltip 并由触发按钮描述，焦点不移入，Escape 关闭', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Button>前一个</Button>
        <Popover openOn="hover" role="tooltip" trigger={<Button aria-label="复位条件">?</Button>}>
          由 PLC 发 faultReset 复位
        </Popover>
      </ThemeProvider>,
    );
    screen.getByRole('button', { name: '前一个' }).focus();
    await user.tab();
    const trigger = screen.getByRole('button', { name: '复位条件' });
    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('由 PLC 发 faultReset 复位');
    expect(trigger).toHaveAccessibleDescription('由 PLC 发 faultReset 复位');
    expect(trigger).toHaveFocus();
    expect(trigger).not.toHaveAttribute('aria-haspopup');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
  it('上下文帮助指针操作 → 悬停打开、移出关闭；点击固定后移出不关闭，再次点击关闭', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Popover
          openOn="hover"
          role="tooltip"
          delay={0}
          trigger={<Button aria-label="曲线读法">?</Button>}
        >
          绿色带为公差
        </Popover>
        <p>外部</p>
      </ThemeProvider>,
    );
    const trigger = screen.getByRole('button', { name: '曲线读法' });
    await user.hover(trigger);
    expect(await screen.findByRole('tooltip')).toBeVisible();
    await user.unhover(trigger);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    await user.click(trigger);
    await user.unhover(trigger);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByRole('tooltip')).toBeVisible();
    await user.click(trigger);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });
  it('上下文帮助回车固定后 Tab 移出 → 仍然显示，Escape 关闭并让焦点回到触发按钮', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Popover openOn="hover" role="tooltip" trigger={<Button aria-label="选帧说明">?</Button>}>
          切换原图不会改变整件判定
        </Popover>
        <Button>下一项</Button>
      </ThemeProvider>,
    );
    const trigger = screen.getByRole('button', { name: '选帧说明' });
    await user.tab();
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toBeVisible();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: '下一项' })).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByRole('tooltip')).toBeVisible();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
  it('悬停对话框浮层键盘回车固定 → 焦点进入浮层，内容可达，Escape 后回到触发按钮', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Popover openOn="hover" title="说明" trigger={<Button>帮助</Button>}>
          <a href="#doc">详细文档</a>
        </Popover>
        <Button>下一项</Button>
      </ThemeProvider>,
    );
    const trigger = screen.getByRole('button', { name: '帮助' });
    await user.tab();
    const dialog = await screen.findByRole('dialog', { name: '说明' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await user.tab();
    expect(screen.getByRole('link', { name: '详细文档' })).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByRole('dialog', { name: '说明' })).toBeVisible();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
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
