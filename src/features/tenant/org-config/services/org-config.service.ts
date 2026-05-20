import { BaseService } from '@/services/base-service';
import type {
  OrgSettings,
  UpsertOrgSettingsRequest,
  WorkingTimeConfig,
  UpsertWorkingTimeRequest,
  Holiday,
  CreateHolidayRequest,
} from '../types/org-config.types';

export class OrgConfigService extends BaseService {
  // ─── Org Settings ───────────────────────────────────────────────────────────

  getSettings(): Promise<OrgSettings> {
    return this.get('/v1/org-config/settings');
  }

  upsertSettings(body: UpsertOrgSettingsRequest): Promise<OrgSettings> {
    return this.put('/v1/org-config/settings', body);
  }

  // ─── Working Time ──────────────────────────────────────────────────────────

  getWorkingTime(): Promise<WorkingTimeConfig> {
    return this.get('/v1/org-config/working-time');
  }

  upsertWorkingTime(body: UpsertWorkingTimeRequest): Promise<WorkingTimeConfig> {
    return this.put('/v1/org-config/working-time', body);
  }

  // ─── Holidays ──────────────────────────────────────────────────────────────

  getHolidays(): Promise<Holiday[]> {
    return this.get('/v1/org-config/working-time/holidays');
  }

  createHoliday(body: CreateHolidayRequest): Promise<Holiday> {
    return this.post('/v1/org-config/working-time/holidays', body);
  }

  deleteHoliday(id: string): Promise<void> {
    return this.delete(`/v1/org-config/working-time/holidays/${id}`);
  }
}
