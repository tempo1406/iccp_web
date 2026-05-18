export interface ProfileNotifications {
  email: boolean;
  push: boolean;
  sms: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
}

export const defaultProfileNotifications: ProfileNotifications = {
  email: true,
  push: true,
  sms: false,
  productUpdates: true,
  securityAlerts: true,
  weeklyDigest: false,
};
