import { useSyncExternalStore, type ReactNode } from 'react';
import { breadcrumbOf, type AdminController } from '@mihua/core';
import { useKit } from '../../context';
import { Icon } from '../../icon';
import '@mihua/core/styles/admin.css';

export interface AdminFrameProps {
  controller: AdminController;
  /** 内容区。不给就显示一个占位。 */
  children?: ReactNode;
  /** 点了页头的操作按钮（比如「新建客户」），内容区的页面要接着做什么。 */
  onAction?: (key: string) => void;
}

/**
 * 后台页面框架（React）：顶栏、可收起的侧栏、内容区（面包屑 + 页头 + 内容）。
 * 结构和文案来自 @mihua/core 的 ADMIN_FRAME，布局来自 admin.css，和 Vue 那份（AdminFrame.vue）一样；
 * 导航菜单、面包屑、下拉菜单、头像、徽标、按钮全部来自套件（useKit），换组件库这里一行不改。
 * 每个区域标了 data-region，自动检查按区域量。
 */
export function AdminFrame({ controller, children, onAction }: AdminFrameProps) {
  const kit = useKit();
  const s = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const { frame, send } = controller;
  const page = frame.pages[s.selected] ?? { title: '', description: '' };
  return (
    <div className="mh-admin" data-collapsed={s.collapsed || undefined}>
      <header className="mh-admin__header" data-region="header">
        <div className="mh-admin__brand">
          <span className="mh-admin__mark" aria-hidden>
            {frame.brand.mark}
          </span>
          <span className="mh-admin__name">{frame.brand.name}</span>
        </div>
        <div className="mh-admin__tools">
          <button
            type="button"
            className="mh-admin__icon-btn"
            aria-label={frame.text.notifications(frame.unread)}
          >
            <kit.Badge count={frame.unread}>
              <Icon name="bell" />
            </kit.Badge>
          </button>
          <kit.Dropdown
            items={frame.userMenu}
            onSelect={(key) => send({ type: 'action', key })}
            aria-label={frame.text.userMenu}
          >
            {/* 名字写在按钮上：头像里的字不算进按钮的名字 */}
            <button type="button" className="mh-admin__user" aria-label={frame.user.name}>
              <kit.Avatar text={frame.user.avatar} />
              <span>{frame.user.name}</span>
              <Icon name="chevron-down" className="mh-admin__caret" />
            </button>
          </kit.Dropdown>
        </div>
      </header>
      <div className="mh-admin__body">
        <aside className="mh-admin__sider" data-region="sider">
          <div className="mh-admin__nav">
            <kit.NavMenu
              items={frame.nav}
              selected={s.selected}
              onSelect={(key) => send({ type: 'select', key })}
              open={s.open}
              onOpenChange={(keys) => send({ type: 'open', keys })}
              collapsed={s.collapsed}
              aria-label={frame.text.nav}
            />
          </div>
          <div className="mh-admin__sider-foot">
            <button
              type="button"
              className="mh-admin__icon-btn"
              aria-label={s.collapsed ? frame.text.expand : frame.text.collapse}
              onClick={() => send({ type: 'collapse', collapsed: !s.collapsed })}
            >
              <Icon name={s.collapsed ? 'sidebar-expand' : 'sidebar-collapse'} />
            </button>
          </div>
        </aside>
        <main className="mh-admin__main">
          <div data-region="breadcrumb">
            <kit.Breadcrumb
              items={breadcrumbOf(frame, s.selected)}
              onNavigate={(key) => send({ type: 'select', key })}
              aria-label={frame.text.breadcrumb}
            />
          </div>
          <div className="mh-admin__page-head" data-region="page-head">
            <div>
              <h1 className="mh-admin__title">{page.title}</h1>
              <p className="mh-admin__desc">{page.description}</p>
            </div>
            <div className="mh-admin__actions">
              {frame.actions.map((action) => (
                <kit.Button
                  key={action.key}
                  variant={action.variant}
                  onClick={() => {
                    send({ type: 'action', key: action.key });
                    onAction?.(action.key);
                  }}
                >
                  {action.label}
                </kit.Button>
              ))}
            </div>
          </div>
          <div
            className="mh-admin__content"
            data-region="content"
            data-placeholder={children ? undefined : ''}
          >
            {children ?? frame.text.placeholder(page.title)}
          </div>
        </main>
      </div>
    </div>
  );
}
