export interface NotificationsListQuery {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
  scope?: 'all' | 'activity';
}
