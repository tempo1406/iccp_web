'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateMyProfileDto, UserProfileDto } from '@/services/users/types';
import { useProfileUpdateAction } from '../hooks/use-profile-actions';

interface ProfilePersonalInfoCardProps {
  profile?: UserProfileDto;
}

interface ProfileSubmitState {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
}

function getProfileSubmitState(profile?: UserProfileDto): ProfileSubmitState {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    dateOfBirth: profile?.dateOfBirth?.split('T')[0] ?? '',
  };
}

function normalizeInternationalPhone(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/[\s().-]/g, '');
}

function isValidInternationalPhone(value: string): boolean {
  const normalized = normalizeInternationalPhone(value);
  if (!normalized) return true;

  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function buildUpdatePayload(next: ProfileSubmitState, profile: UserProfileDto): UpdateMyProfileDto {
  const payload: UpdateMyProfileDto = {};

  const changed = (value: string, oldValue: string | null) =>
    value.trim() !== (oldValue ?? '').trim();

  const nextFirstName = next.firstName.trim();
  const nextLastName = next.lastName.trim();
  const nextPhone = normalizeInternationalPhone(next.phone);
  const currentPhone = normalizeInternationalPhone(profile.phone);

  if (changed(next.firstName, profile.firstName) && nextFirstName.length > 0) {
    payload.firstName = nextFirstName;
  }
  if (changed(next.lastName, profile.lastName) && nextLastName.length > 0) {
    payload.lastName = nextLastName;
  }
  if (nextPhone !== currentPhone) payload.phone = nextPhone || null;
  if (changed(next.address, profile.address)) payload.address = next.address.trim() || null;
  if (changed(next.dateOfBirth, profile.dateOfBirth?.split('T')[0] ?? null)) {
    payload.dateOfBirth = next.dateOfBirth.trim() || null;
  }

  return payload;
}

export function ProfilePersonalInfoCard({ profile }: ProfilePersonalInfoCardProps) {
  const t = useTranslations('profile.personalInfo');
  const { saveProfile, isPending } = useProfileUpdateAction();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ProfileSubmitState>(() => getProfileSubmitState(profile));
  const [phoneError, setPhoneError] = useState('');
  const today = new Date();
  const earliestBirthDate = new Date(1900, 0, 1);
  const defaultBirthMonth = new Date(today.getFullYear() - 18, today.getMonth(), 1);

  const updateField =
    (field: keyof ProfileSubmitState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setFormState((current) => ({ ...current, [field]: value }));
    };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFormState((current) => ({ ...current, phone: value }));
    if (phoneError && isValidInternationalPhone(value)) {
      setPhoneError('');
    }
  };

  const handleCancel = () => {
    setFormState(getProfileSubmitState(profile));
    setPhoneError('');
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setFormState(getProfileSubmitState(profile));
    setPhoneError('');
    setIsEditing(true);
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    if (!isValidInternationalPhone(formState.phone)) {
      setPhoneError(t('phoneError'));
      return;
    }

    const payload = buildUpdatePayload(formState, profile);
    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    const result = await saveProfile(payload);
    if (result.ok) {
      setIsEditing(false);
    }
  };

  const isReadOnly = !profile || isPending || !isEditing;
  const displayState = isEditing ? formState : getProfileSubmitState(profile);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!profile || isPending}
            onClick={handleStartEditing}
          >
            {t('edit')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">{t('firstName')}</Label>
              <Input
                id="firstName"
                name="firstName"
                value={displayState.firstName}
                onChange={updateField('firstName')}
                disabled={isReadOnly}
                className="disabled:opacity-100"
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t('lastName')}</Label>
              <Input
                id="lastName"
                name="lastName"
                value={displayState.lastName}
                onChange={updateField('lastName')}
                disabled={isReadOnly}
                className="disabled:opacity-100"
              />
            </div>
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="disabled:opacity-100"
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={displayState.phone}
                onChange={handlePhoneChange}
                disabled={isReadOnly}
                placeholder={t('phonePlaceholder')}
                aria-invalid={phoneError ? 'true' : undefined}
                className="disabled:opacity-100"
              />
              {phoneError ? (
                <p className="mt-1 text-xs text-destructive">{phoneError}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
              <DatePicker
                id="dateOfBirth"
                value={displayState.dateOfBirth}
                onChange={(value) => setFormState((current) => ({ ...current, dateOfBirth: value }))}
                placeholder={t('datePlaceholder')}
                disabled={isReadOnly}
                maxDate={today}
                defaultMonth={defaultBirthMonth}
                startMonth={earliestBirthDate}
                endMonth={today}
                captionLayout="dropdown"
                reverseYears
                className="h-9 disabled:opacity-100"
              />
            </div>
            <div>
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                name="address"
                value={displayState.address}
                onChange={updateField('address')}
                disabled={isReadOnly}
                className="disabled:opacity-100"
              />
            </div>
          </div>
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={!profile || isPending}>
                {isPending ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
