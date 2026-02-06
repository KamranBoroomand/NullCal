export type Language = 'en' | 'ru' | 'fa';

export type TranslationKey =
  | 'app.offline'
  | 'app.syncing'
  | 'app.online'
  | 'topbar.install'
  | 'topbar.highContrast'
  | 'topbar.language'
  | 'topbar.timeZone'
  | 'topbar.addTimeZone'
  | 'topbar.removeTimeZone'
  | 'topbar.customTimeZone'
  | 'wizard.title'
  | 'wizard.step'
  | 'wizard.next'
  | 'wizard.back'
  | 'wizard.finish'
  | 'wizard.basics'
  | 'wizard.schedule'
  | 'wizard.location'
  | 'wizard.attendees'
  | 'wizard.review'
  | 'wizard.titleLabel'
  | 'wizard.calendarLabel'
  | 'wizard.start'
  | 'wizard.end'
  | 'wizard.locationLabel'
  | 'wizard.recurrence'
  | 'wizard.recurrence.none'
  | 'wizard.recurrence.daily'
  | 'wizard.recurrence.weekly'
  | 'wizard.recurrence.monthly'
  | 'wizard.recurrence.custom'
  | 'wizard.reminder'
  | 'wizard.attendeesLabel'
  | 'wizard.notes'
  | 'wizard.reviewHint'
  | 'profile.avatarUpload'
  | 'profile.displayName'
  | 'profile.phone'
  | 'profile.location'
  | 'profile.preferredNotification'
  | 'profile.preferredNotification.email'
  | 'profile.preferredNotification.sms'
  | 'profile.save'
  | 'language.english'
  | 'language.russian'
  | 'language.persian';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'app.offline': 'Offline mode — changes will sync once you reconnect.',
    'app.syncing': 'Syncing updates…',
    'app.online': 'Back online.',
    'topbar.install': 'Install app',
    'topbar.highContrast': 'High contrast',
    'topbar.language': 'Language',
    'topbar.timeZone': 'Local time',
    'topbar.addTimeZone': 'Add time zone',
    'topbar.removeTimeZone': 'Remove',
    'topbar.customTimeZone': 'Custom time zone',
    'wizard.title': 'Event setup',
    'wizard.step': 'Step',
    'wizard.next': 'Next',
    'wizard.back': 'Back',
    'wizard.finish': 'Save event',
    'wizard.basics': 'Basics',
    'wizard.schedule': 'Schedule',
    'wizard.location': 'Location & reminders',
    'wizard.attendees': 'Attendees',
    'wizard.review': 'Review',
    'wizard.titleLabel': 'Event title',
    'wizard.calendarLabel': 'Calendar',
    'wizard.start': 'Start',
    'wizard.end': 'End',
    'wizard.locationLabel': 'Location',
    'wizard.recurrence': 'Recurrence',
    'wizard.recurrence.none': 'No recurrence',
    'wizard.recurrence.daily': 'Daily',
    'wizard.recurrence.weekly': 'Weekly',
    'wizard.recurrence.monthly': 'Monthly',
    'wizard.recurrence.custom': 'Custom rule',
    'wizard.reminder': 'Reminder',
    'wizard.attendeesLabel': 'Attendees (comma separated)',
    'wizard.notes': 'Notes',
    'wizard.reviewHint': 'Confirm details before saving.',
    'profile.avatarUpload': 'Upload avatar',
    'profile.displayName': 'Display name',
    'profile.phone': 'Phone number',
    'profile.location': 'Location',
    'profile.preferredNotification': 'Preferred notification',
    'profile.preferredNotification.email': 'Email',
    'profile.preferredNotification.sms': 'SMS',
    'profile.save': 'Save profile',
    'language.english': 'English',
    'language.russian': 'Russian',
    'language.persian': 'Persian'
  },
  ru: {
    'app.offline': 'Режим офлайн — изменения синхронизируются при подключении.',
    'app.syncing': 'Синхронизация обновлений…',
    'app.online': 'Снова онлайн.',
    'topbar.install': 'Установить приложение',
    'topbar.highContrast': 'Высокий контраст',
    'topbar.language': 'Язык',
    'topbar.timeZone': 'Местное время',
    'topbar.addTimeZone': 'Добавить часовой пояс',
    'topbar.removeTimeZone': 'Удалить',
    'topbar.customTimeZone': 'Пользовательский пояс',
    'wizard.title': 'Настройка события',
    'wizard.step': 'Шаг',
    'wizard.next': 'Далее',
    'wizard.back': 'Назад',
    'wizard.finish': 'Сохранить',
    'wizard.basics': 'Основное',
    'wizard.schedule': 'Расписание',
    'wizard.location': 'Место и напоминания',
    'wizard.attendees': 'Участники',
    'wizard.review': 'Проверка',
    'wizard.titleLabel': 'Название события',
    'wizard.calendarLabel': 'Календарь',
    'wizard.start': 'Начало',
    'wizard.end': 'Окончание',
    'wizard.locationLabel': 'Место',
    'wizard.recurrence': 'Повторение',
    'wizard.recurrence.none': 'Без повторения',
    'wizard.recurrence.daily': 'Ежедневно',
    'wizard.recurrence.weekly': 'Еженедельно',
    'wizard.recurrence.monthly': 'Ежемесячно',
    'wizard.recurrence.custom': 'Пользовательское правило',
    'wizard.reminder': 'Напоминание',
    'wizard.attendeesLabel': 'Участники (через запятую)',
    'wizard.notes': 'Заметки',
    'wizard.reviewHint': 'Подтвердите детали перед сохранением.',
    'profile.avatarUpload': 'Загрузить аватар',
    'profile.displayName': 'Отображаемое имя',
    'profile.phone': 'Телефон',
    'profile.location': 'Локация',
    'profile.preferredNotification': 'Предпочтительные уведомления',
    'profile.preferredNotification.email': 'Email',
    'profile.preferredNotification.sms': 'SMS',
    'profile.save': 'Сохранить профиль',
    'language.english': 'Английский',
    'language.russian': 'Русский',
    'language.persian': 'Персидский'
  },
  fa: {
    'app.offline': 'حالت آفلاین — تغییرات پس از اتصال همگام‌سازی می‌شوند.',
    'app.syncing': 'در حال همگام‌سازی…',
    'app.online': 'آنلاین شد.',
    'topbar.install': 'نصب برنامه',
    'topbar.highContrast': 'کنتراست بالا',
    'topbar.language': 'زبان',
    'topbar.timeZone': 'زمان محلی',
    'topbar.addTimeZone': 'افزودن منطقه زمانی',
    'topbar.removeTimeZone': 'حذف',
    'topbar.customTimeZone': 'منطقه زمانی سفارشی',
    'wizard.title': 'راه‌اندازی رویداد',
    'wizard.step': 'مرحله',
    'wizard.next': 'بعدی',
    'wizard.back': 'بازگشت',
    'wizard.finish': 'ذخیره رویداد',
    'wizard.basics': 'اطلاعات پایه',
    'wizard.schedule': 'زمان‌بندی',
    'wizard.location': 'مکان و یادآوری‌ها',
    'wizard.attendees': 'شرکت‌کنندگان',
    'wizard.review': 'بازبینی',
    'wizard.titleLabel': 'عنوان رویداد',
    'wizard.calendarLabel': 'تقویم',
    'wizard.start': 'شروع',
    'wizard.end': 'پایان',
    'wizard.locationLabel': 'مکان',
    'wizard.recurrence': 'تکرار',
    'wizard.recurrence.none': 'بدون تکرار',
    'wizard.recurrence.daily': 'روزانه',
    'wizard.recurrence.weekly': 'هفتگی',
    'wizard.recurrence.monthly': 'ماهانه',
    'wizard.recurrence.custom': 'قانون سفارشی',
    'wizard.reminder': 'یادآوری',
    'wizard.attendeesLabel': 'شرکت‌کنندگان (جدا با ویرگول)',
    'wizard.notes': 'یادداشت‌ها',
    'wizard.reviewHint': 'جزئیات را پیش از ذخیره بررسی کنید.',
    'profile.avatarUpload': 'بارگذاری آواتار',
    'profile.displayName': 'نام نمایشی',
    'profile.phone': 'شماره تلفن',
    'profile.location': 'موقعیت',
    'profile.preferredNotification': 'روش اعلان ترجیحی',
    'profile.preferredNotification.email': 'ایمیل',
    'profile.preferredNotification.sms': 'پیامک',
    'profile.save': 'ذخیره پروفایل',
    'language.english': 'انگلیسی',
    'language.russian': 'روسی',
    'language.persian': 'فارسی'
  }
};
