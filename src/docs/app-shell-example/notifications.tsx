import type { ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Indicator,
  List,
  ListItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../index';
import type { PopoverProps } from '../../index';
import { BellIcon, ChecksIcon } from './icons';
import './notifications.css';

export type NotificationItem = {
  id: string;
  title: string;
  /** When it happened, in words: the description of the row. */
  time: string;
  /** Where the row leads. */
  href: string;
  unread: boolean;
  /** The initials of the person it is from. Without them the row shows `icon` in a ring. */
  from?: string;
  icon?: ReactNode;
  /** `success` tints the ring of the icon green. */
  tone?: 'success';
};

export type NotificationsProps = {
  items: NotificationItem[];
  /** Called by "Mark all as read". Your app marks them and passes the new `items`. */
  onMarkAllRead: () => void;
  /** The state of the popover: `open`, `defaultOpen` and `onOpenChange`. */
  popover?: Omit<PopoverProps, 'children'>;
};

/**
 * The name of the bell has the count in it, because the number on its corner is only for the eyes
 * (the Indicator hides it from a screen reader).
 */
const bellName = (unread: number) =>
  unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

/**
 * One notification. A row that has not been read says so in more than its colour: its title is
 * bolder, it starts with the words "Unread: " for a screen reader, and it ends with a dot.
 */
function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <ListItem
      className="notif-row"
      data-unread={item.unread ? '' : undefined}
      href={item.href}
      start={
        item.from ? (
          <Avatar alt="" fallback={item.from} />
        ) : (
          <span className="notif-ring" data-tone={item.tone} aria-hidden="true">
            {item.icon}
          </span>
        )
      }
      title={
        <>
          {item.unread ? <span className="notif-sr">Unread: </span> : null}
          {item.title}
        </>
      }
      description={item.time}
      end={item.unread ? <span className="notif-dot" aria-hidden="true" /> : undefined}
    />
  );
}

function Empty() {
  return (
    <div className="notif-empty">
      <span className="notif-ring" aria-hidden="true">
        <BellIcon />
      </span>
      <span className="notif-empty-title">No new notifications</span>
      <span className="notif-empty-hint">New notifications will show up here.</span>
    </div>
  );
}

/**
 * The first row of the panel: the title and "Mark all as read". The button stays while there is
 * anything in the list, also when nothing is unread any more: pressing it takes it away from under
 * the focus otherwise, and the focus would fall to the page. It stays where it is instead.
 */
function Head({
  title,
  showMarkAll,
  onMarkAllRead,
}: {
  title: string;
  showMarkAll: boolean;
  onMarkAllRead: () => void;
}) {
  return (
    <div className="notif-head">
      <span className="notif-title">{title}</span>
      {showMarkAll ? (
        <Button variant="ghost" size="sm" className="notif-mark-all" onClick={onMarkAllRead}>
          <ChecksIcon />
          Mark all as read
        </Button>
      ) : null}
    </div>
  );
}

/** The bell, with the count of unread notifications on its corner, that opens `panel`. */
function Bell({
  unread,
  status,
  popover,
  panelClass,
  panel,
}: {
  unread: number;
  status: 'danger' | 'accent';
  popover: NotificationsProps['popover'];
  panelClass: string;
  panel: ReactNode;
}) {
  return (
    <Popover {...popover}>
      <Indicator status={status} count={unread}>
        <PopoverTrigger asChild>
          <IconButton variant="ghost" aria-label={bellName(unread)}>
            <BellIcon />
          </IconButton>
        </PopoverTrigger>
      </Indicator>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={17}
        arrow={false}
        aria-label="Notifications"
        className={panelClass}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

/**
 * B1: a red count on the bell, and a panel with a heading and one list. The list is an `inset` List
 * with no glass of its own (`surface={false}`): the panel is the glass.
 */
export function ListNotifications({ items, onMarkAllRead, popover }: NotificationsProps) {
  const unread = items.filter((item) => item.unread).length;
  return (
    <Bell
      unread={unread}
      status="danger"
      popover={popover}
      panelClass="notif-panel notif-panel-list"
      panel={
        <>
          <Head
            title="Notifications"
            showMarkAll={items.length > 0}
            onMarkAllRead={onMarkAllRead}
          />
          {items.length > 0 ? (
            <List surface={false} aria-label="Notifications">
              {items.map((item) => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </List>
          ) : (
            <Empty />
          )}
        </>
      }
    />
  );
}

/**
 * B3: an accent count on the bell, and a panel with the tabs "All" and "Unread", each over a plain
 * list.
 */
export function TabbedNotifications({ items, onMarkAllRead, popover }: NotificationsProps) {
  const unreadItems = items.filter((item) => item.unread);
  const unread = unreadItems.length;
  const rows = (shown: NotificationItem[]) =>
    shown.length > 0 ? (
      <List variant="plain" aria-label="Notifications">
        {shown.map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}
      </List>
    ) : (
      <Empty />
    );
  return (
    <Bell
      unread={unread}
      status="accent"
      popover={popover}
      panelClass="notif-panel notif-panel-tabs"
      panel={
        <>
          <Head
            title="Notifications"
            showMarkAll={items.length > 0}
            onMarkAllRead={onMarkAllRead}
          />
          <Tabs defaultValue="all" className="notif-tabs">
            <TabsList aria-label="Show">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unread > 0 ? <Badge variant="accent">{unread}</Badge> : null}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">{rows(items)}</TabsContent>
            <TabsContent value="unread">{rows(unreadItems)}</TabsContent>
          </Tabs>
        </>
      }
    />
  );
}
