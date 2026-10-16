import { useId, useSyncExternalStore, type ReactNode } from 'react';
import {
  customerPage,
  formatAmount,
  type CustomerForm,
  type CustomerFormErrors,
  type CustomerListController,
  type CustomerStatus,
} from '@mihua/core';
import type { TableColumn, TableRow } from '@mihua/spec';
import { useKit } from '../../context';
import { Icon } from '../../icon';
import '@mihua/core/styles/customers.css';

export interface CustomerListProps {
  controller: CustomerListController;
}

/**
 * 客户列表（React）：筛选栏、表格（勾选、排序、状态标签、开关、操作列）、分页。
 * 结构和文案来自 @mihua/core 的 CUSTOMER_LIST，布局来自 customers.css，和 Vue 那份（CustomerList.vue）一样；
 * 控件全部来自套件（useKit），换组件库这里一行不改。业务状态都在控制器里。
 * 每个区域标了 data-region，自动检查按区域量。
 */
export function CustomerList({ controller }: CustomerListProps) {
  const kit = useKit();
  const s = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const { list, send } = controller;
  const { text } = list;
  const { rows, total, page } = customerPage(s, list);
  const statusOf = (value: unknown) => list.statuses.find((x) => x.value === value)!;

  const renderCell = (row: TableRow, column: TableColumn) => {
    const name = row.name as string;
    switch (column.key) {
      case 'name':
        return <span className="mh-list__name">{name}</span>;
      case 'status': {
        const status = statusOf(row.status);
        return <kit.Tag tone={status.tone}>{status.label}</kit.Tag>;
      }
      case 'amount':
        return <span className="mh-list__num">{formatAmount(row.amount as number)}</span>;
      case 'important':
        return (
          <kit.Switch
            checked={row.important as boolean}
            onChange={(value) => send({ type: 'important', key: row.key, value })}
            aria-label={text.important(name)}
          />
        );
      case 'actions':
        return (
          <div className="mh-list__ops">
            <kit.Button
              variant="link"
              aria-label={text.editLabel(name)}
              onClick={() => send({ type: 'edit', key: row.key })}
            >
              {text.edit}
            </kit.Button>
            <kit.Button
              variant="link"
              aria-label={text.followLabel(name)}
              onClick={() => send({ type: 'action', key: `follow:${row.key}` })}
            >
              {text.follow}
            </kit.Button>
          </div>
        );
      default:
        return String(row[column.key] ?? '');
    }
  };

  const empty =
    s.status === 'error' ? (
      <div className="mh-list__empty" role="alert">
        <Icon name="alert" className="mh-list__empty-icon" />
        <p className="mh-list__empty-title">{text.errorTitle}</p>
        <p className="mh-list__empty-desc">{text.errorDescription}</p>
        <kit.Button variant="link" onClick={() => send({ type: 'retry' })}>
          {text.retry}
        </kit.Button>
      </div>
    ) : (
      <div className="mh-list__empty">
        <Icon name="inbox" className="mh-list__empty-icon" />
        <p className="mh-list__empty-title">{text.emptyTitle}</p>
        <p className="mh-list__empty-desc">{text.emptyDescription}</p>
        <kit.Button variant="link" onClick={() => send({ type: 'reset' })}>
          {text.reset}
        </kit.Button>
      </div>
    );

  return (
    <div className="mh-list">
      <form
        className="mh-list__filter"
        data-region="filter"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          send({ type: 'query' });
        }}
      >
        <div className="mh-list__keyword">
          <kit.Input
            name="keyword"
            value={s.draft.keyword}
            onChange={(keyword) => send({ type: 'draft', patch: { keyword } })}
            placeholder={text.keyword}
            aria-label={text.keywordLabel}
          />
        </div>
        <kit.Select
          value={s.draft.status}
          onChange={(status) =>
            send({ type: 'draft', patch: { status: status as CustomerStatus | 'all' } })
          }
          options={[
            { value: 'all', label: text.allStatuses },
            ...list.statuses.map(({ value, label }) => ({ value, label })),
          ]}
          aria-label={text.status}
          width={160}
        />
        <div className="mh-list__range">
          <kit.DateRange
            value={s.draft.range}
            onChange={(range) => send({ type: 'draft', patch: { range } })}
            placeholder={[text.rangeStart, text.rangeEnd]}
            separator={text.rangeSeparator}
            labels={[text.rangeStart, text.rangeEnd]}
            aria-label={text.dateRange}
          />
        </div>
        <div className="mh-list__filter-actions">
          <kit.Button variant="primary" type="submit">
            {text.query}
          </kit.Button>
          <kit.Button variant="secondary" onClick={() => send({ type: 'reset' })}>
            {text.reset}
          </kit.Button>
        </div>
      </form>
      <section className="mh-list__panel" aria-label={text.table}>
        <div className="mh-list__bar" data-region="toolbar">
          {s.selected.length ? (
            <>
              <span>{text.selected(s.selected.length)}</span>
              <kit.Button variant="link" onClick={() => send({ type: 'select', keys: [] })}>
                {text.clearSelection}
              </kit.Button>
            </>
          ) : (
            <span>{text.count(total)}</span>
          )}
        </div>
        <div className="mh-list__table" data-region="table">
          <kit.Table
            columns={list.columns}
            rows={rows}
            renderCell={renderCell}
            selected={s.selected}
            onSelectedChange={(keys) => send({ type: 'select', keys })}
            sort={s.sort}
            onSortChange={(sort) => send({ type: 'sort', sort })}
            loading={s.status === 'loading'}
            empty={empty}
            selectLabel={(row) => text.select(row.name as string)}
            selectAllLabel={text.selectAll}
            aria-label={text.table}
          />
        </div>
        {total > 0 && (
          <div className="mh-list__pagination" data-region="pagination">
            <kit.Pagination
              page={page}
              pageSize={list.pageSize}
              total={total}
              onChange={(next) => send({ type: 'page', page: next })}
              totalText={text.total}
              pageLabel={text.page}
              prevLabel={text.prev}
              nextLabel={text.next}
              aria-label={text.pagination}
            />
          </div>
        )}
      </section>
      <CustomerDialog controller={controller} />
    </div>
  );
}

/** 一个表单项：上面是名字，下面是控件和出错提示。 */
function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const Label = id ? 'label' : 'span';
  return (
    <div className="mh-form__item">
      <Label className="mh-form__label" {...(id ? { htmlFor: id } : {})}>
        {required && (
          <span className="mh-form__required" aria-hidden>
            *
          </span>
        )}
        {label}
      </Label>
      {children}
      {error && (
        <p className="mh-form__error" id={id && `${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 编辑对话框：新建或编辑一位客户。表单的值、出错提示都在控制器里（React、Vue 共用一份），
 * 对话框开没开也在控制器里；按 Esc、点关闭按钮、点取消都是「关」，点保存先校验。
 */
function CustomerDialog({ controller }: CustomerListProps) {
  const kit = useKit();
  const s = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const { list, send } = controller;
  const { text } = list;
  const id = useId();
  const dialog = s.dialog;
  const form = dialog?.form;
  const errors: CustomerFormErrors = dialog?.errors ?? {};
  const set = (patch: Partial<CustomerForm>) => send({ type: 'form', patch });
  const described = (key: keyof CustomerFormErrors) =>
    errors[key] ? `${id}-${key}-error` : undefined;
  return (
    <kit.Dialog
      open={!!dialog}
      onClose={() => send({ type: 'close' })}
      title={dialog?.key ? text.editTitle : text.createTitle}
      closeLabel={text.close}
      footer={
        <div className="mh-form__footer" data-region="dialog-footer">
          <kit.Button variant="secondary" onClick={() => send({ type: 'close' })}>
            {text.cancel}
          </kit.Button>
          <kit.Button variant="primary" onClick={() => send({ type: 'save' })}>
            {text.save}
          </kit.Button>
        </div>
      }
    >
      {form && (
        <div className="mh-form" data-region="dialog-form">
          <Field id={`${id}-name`} label={text.fields.name} required error={errors.name}>
            <kit.Input
              id={`${id}-name`}
              name="name"
              value={form.name}
              onChange={(name) => set({ name })}
              placeholder={text.namePlaceholder}
              invalid={!!errors.name}
              aria-describedby={described('name')}
            />
          </Field>
          <Field id={`${id}-phone`} label={text.fields.phone} error={errors.phone}>
            <kit.Input
              id={`${id}-phone`}
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(phone) => set({ phone })}
              placeholder={text.phonePlaceholder}
              invalid={!!errors.phone}
              aria-describedby={described('phone')}
            />
          </Field>
          <div className="mh-form__row">
            <Field label={text.fields.status}>
              <kit.Select
                value={form.status}
                onChange={(status) => set({ status: status as CustomerStatus })}
                options={list.statuses.map(({ value, label }) => ({ value, label }))}
                aria-label={text.fields.status}
              />
            </Field>
            <Field label={text.fields.owner}>
              <kit.Select
                value={form.owner}
                onChange={(owner) => set({ owner })}
                options={list.owners.map((owner) => ({ value: owner, label: owner }))}
                aria-label={text.fields.owner}
              />
            </Field>
          </div>
          <Field label={text.fields.level}>
            <kit.Radio
              value={form.level}
              onChange={(level) => set({ level: level as CustomerForm['level'] })}
              options={list.levels}
              aria-label={text.fields.level}
            />
          </Field>
          <Field id={`${id}-note`} label={text.fields.note} error={errors.note}>
            <kit.Textarea
              id={`${id}-note`}
              name="note"
              value={form.note}
              onChange={(note) => set({ note })}
              placeholder={text.notePlaceholder}
              invalid={!!errors.note}
              aria-describedby={described('note')}
            />
          </Field>
          <div className="mh-form__switch">
            <kit.Switch
              checked={form.important}
              onChange={(important) => set({ important })}
              aria-label={text.fields.important}
            />
            <span aria-hidden>{text.fields.important}</span>
          </div>
        </div>
      )}
    </kit.Dialog>
  );
}
