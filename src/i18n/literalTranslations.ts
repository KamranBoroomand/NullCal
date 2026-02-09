import type { Language } from './translations';

type LiteralDictionary = Record<string, string>;

const ruLiterals: LiteralDictionary = {
  'NullCal — Calendar': 'NullCal — Календарь',
  'NullCal — Safety Center': 'NullCal — Центр безопасности',
  'NullCal hit an unexpected error': 'NullCal столкнулся с непредвиденной ошибкой',
  'Something went wrong while loading this route. Try reloading the page.':
    'При загрузке этого маршрута произошла ошибка. Попробуйте перезагрузить страницу.',
  'Something went wrong while rendering this view. Reload the page to try again.':
    'При отображении этого экрана произошла ошибка. Перезагрузите страницу и попробуйте снова.',
  'Debug details': 'Отладочная информация',
  Reload: 'Перезагрузить',
  'Profile name': 'Имя профиля',
  'Decoy profile name': 'Имя профиля-приманки',
  Decoy: 'Приманка',
  'Reset this profile back to default calendars (events removed)?':
    'Сбросить этот профиль к календарям по умолчанию (события будут удалены)?',
  'Untitled event': 'Событие без названия',
  'Passphrases do not match.': 'Пароли не совпадают.',
  'Failed to encrypt note.': 'Не удалось зашифровать заметку.',
  'Template name is required.': 'Требуется имя шаблона.',
  'Template saved.': 'Шаблон сохранен.',
  'Failed to decrypt note.': 'Не удалось расшифровать заметку.',
  'Create a passphrase to encrypt this backup.': 'Создайте пароль для шифрования этой резервной копии.',
  'Encrypted backup exported.': 'Зашифрованная резервная копия экспортирована.',
  'Export failed. Try again.': 'Экспорт не удался. Попробуйте снова.',
  'No profile data available to export.': 'Нет данных профиля для экспорта.',
  'Create a passphrase for the full export.': 'Создайте пароль для полного экспорта.',
  'Create a passphrase for the clean export.': 'Создайте пароль для очищенного экспорта.',
  'Create a passphrase for the minimal export.': 'Создайте пароль для минимального экспорта.',
  'Full export saved.': 'Полный экспорт сохранен.',
  'Clean export saved.': 'Очищенный экспорт сохранен.',
  'No profile data available.': 'Данные профиля недоступны.',
  'Set a decoy profile in Safety Center.': 'Установите профиль-приманку в Центре безопасности.',
  'Unlock to switch profiles.': 'Разблокируйте, чтобы переключить профиль.',
  'Switched to decoy profile.': 'Переключено на профиль-приманку.',
  'Enter your backup passphrase.': 'Введите пароль резервной копии.',
  'Backup imported successfully.': 'Резервная копия успешно импортирована.',
  'Import failed. Check your passphrase.': 'Импорт не удался. Проверьте пароль.',
  events: 'событий',
  'Edit event': 'Изменить событие',
  'New event': 'Новое событие',
  Template: 'Шаблон',
  'Select a template': 'Выберите шаблон',
  Label: 'Метка',
  'Focus, Travel, Deep work': 'Фокус, Поездка, Глубокая работа',
  Icon: 'Иконка',
  'FREQ=MONTHLY;INTERVAL=1': 'FREQ=MONTHLY;INTERVAL=1',
  'Custom reminder': 'Пользовательское напоминание',
  'Minutes before': 'Минут до начала',
  min: 'мин',
  'alex@example.com, +1 555 0110': 'alex@example.com, +1 555 0110',
  'Encrypted note (unlock to view)': 'Зашифрованная заметка (разблокируйте для просмотра)',
  'Add notes': 'Добавить заметки',
  'Encrypt notes': 'Шифровать заметки',
  'Passphrase to decrypt': 'Пароль для расшифровки',
  'Unlock note': 'Разблокировать заметку',
  Passphrase: 'Пароль',
  'Confirm passphrase': 'Подтвердите пароль',
  'Notes are encrypted locally with AES-GCM before being stored when this toggle is on.':
    'При включении заметки шифруются локально с AES-GCM перед сохранением.',
  'Event templates': 'Шаблоны событий',
  'Template name': 'Имя шаблона',
  'Save template': 'Сохранить шаблон',
  Delete: 'Удалить',
  'Templates capture durations, labels, and reminders for quick reuse.':
    'Шаблоны сохраняют длительность, метки и напоминания для быстрого повторного использования.',
  Cancel: 'Отмена',
  Reminders: 'Напоминания',
  'Enable reminders': 'Включить напоминания',
  'Show device notifications for upcoming events.': 'Показывать уведомления устройства о ближайших событиях.',
  'Reminder channel': 'Канал напоминаний',
  'Local notifications': 'Локальные уведомления',
  'Push notifications': 'Push-уведомления',
  'Email notifications': 'Email-уведомления',
  'SMS notifications': 'SMS-уведомления',
  'Signal secure ping': 'Безопасный пинг Signal',
  'Telegram secure ping': 'Безопасный пинг Telegram',
  'Notification email': 'Email для уведомлений',
  'Notification phone': 'Телефон для уведомлений',
  'Uses the configured notification service for real SMS/email delivery.':
    'Использует настроенный сервис уведомлений для реальной отправки SMS/email.',
  'Telegram bot token': 'Токен Telegram-бота',
  'Telegram chat ID': 'ID Telegram-чата',
  'Signal webhook URL': 'URL вебхука Signal',
  Notes: 'Заметки',
  'Private notes': 'Приватные заметки',
  'Encrypted notes by default': 'Зашифрованные заметки по умолчанию',
  'Encrypt notes locally with AES-GCM.': 'Шифровать заметки локально с AES-GCM.',
  'Encrypted attachments': 'Зашифрованные вложения',
  'Protect files attached to events.': 'Защитить файлы, прикрепленные к событиям.',
  'At time of event': 'Во время события',
  '5 minutes before': 'За 5 минут',
  '15 minutes before': 'За 15 минут',
  '30 minutes before': 'За 30 минут',
  '1 hour before': 'За 1 час',
  '1 day before': 'За 1 день',
  'Active profile was missing. Switched to the first available profile.':
    'Активный профиль отсутствовал. Переключено на первый доступный профиль.',
  'No profiles found. Created a default profile.': 'Профили не найдены. Создан профиль по умолчанию.',
  'Unable to export: profile data is missing.': 'Невозможно экспортировать: отсутствуют данные профиля.',
  'Export failed.': 'Экспорт не удался.',
  'Import failed.': 'Импорт не удался.',
  'Select a file and passphrase.': 'Выберите файл и пароль.',
  'PINs do not match.': 'PIN-коды не совпадают.',
  'PIN set. Lock screen enabled.': 'PIN установлен. Экран блокировки включен.',
  'Decoy PINs do not match.': 'PIN приманки не совпадают.',
  'Create a decoy profile first.': 'Сначала создайте профиль-приманку.',
  'Decoy PIN set.': 'PIN приманки установлен.',
  'Local passphrase enabled.': 'Локальный пароль включен.',
  'Local passphrase cleared.': 'Локальный пароль очищен.',
  'WebAuthn is not supported on this device.': 'WebAuthn не поддерживается на этом устройстве.',
  'Passkey registered.': 'Ключ доступа зарегистрирован.',
  'Passkey registration failed.': 'Не удалось зарегистрировать ключ доступа.',
  'Passkey removed.': 'Ключ доступа удален.',
  'Biometric unlock disabled.': 'Биометрическая разблокировка отключена.',
  'Biometric unlock is not supported on this device.': 'Биометрическая разблокировка не поддерживается на этом устройстве.',
  'Biometric unlock enabled.': 'Биометрическая разблокировка включена.',
  'Biometric setup failed.': 'Не удалось настроить биометрию.',
  'Add a destination for the verification code.': 'Добавьте адрес назначения для кода подтверждения.',
  'Verification code sent.': 'Код подтверждения отправлен.',
  'Unable to send verification code.': 'Не удалось отправить код подтверждения.',
  'Invalid or expired code.': 'Неверный или просроченный код.',
  'Two-factor authentication enabled.': 'Двухфакторная аутентификация включена.',
  'Two-factor setup failed.': 'Не удалось настроить двухфакторную аутентификацию.',
  'Authenticator secret generated.': 'Секрет для приложения-аутентификатора создан.',
  'Generate a secret first.': 'Сначала сгенерируйте секрет.',
  'Invalid authenticator code.': 'Неверный код аутентификатора.',
  'Authenticator app enabled.': 'Приложение-аутентификатор включено.',
  'Two-factor authentication disabled.': 'Двухфакторная аутентификация отключена.',
  'Authenticator app disabled.': 'Приложение-аутентификатор отключено.',
  'Decentralized sync enabled.': 'Децентрализованная синхронизация включена.',
  'Decentralized sync disabled.': 'Децентрализованная синхронизация отключена.',
  'Trusted device sharing enabled.': 'Общий доступ для доверенных устройств включен.',
  'Trusted device sharing disabled.': 'Общий доступ для доверенных устройств отключен.',
  'Sync token copied.': 'Токен синхронизации скопирован.',
  'Unable to copy sync token.': 'Не удалось скопировать токен синхронизации.',
  'Notifications are not supported on this device.': 'Уведомления не поддерживаются на этом устройстве.',
  'Reminders enabled.': 'Напоминания включены.',
  'Reminders disabled.': 'Напоминания отключены.',
  'Profile updated.': 'Профиль обновлен.',
  'Please upload an image file.': 'Загрузите файл изображения.',
  'Avatar image must be under 1MB.': 'Изображение аватара должно быть меньше 1 МБ.',
  'Event export saved.': 'Экспорт событий сохранен.',
  'Audit log exported.': 'Журнал аудита экспортирован.',
  'Collaboration enabled.': 'Совместная работа включена.',
  'Collaboration disabled.': 'Совместная работа отключена.',
  'Secure sharing enabled.': 'Безопасный обмен включен.',
  'Secure sharing disabled.': 'Безопасный обмен отключен.',
  'Share token copied.': 'Токен обмена скопирован.',
  'Unable to copy token.': 'Не удалось скопировать токен.',
  'Decoy profile already exists.': 'Профиль-приманка уже существует.',
  'Decoy profile cleared.': 'Профиль-приманка очищен.',
  'Decoy profile updated.': 'Профиль-приманка обновлен.',
  'Profile switching is tied to your PIN unlock.': 'Переключение профиля связано с разблокировкой PIN.',
  'Audit log cleared.': 'Журнал аудита очищен.',
  'Set a decoy profile first.': 'Сначала задайте профиль-приманку.',
  'Switch active profile?': 'Переключить активный профиль?',
  'Safe State': 'Безопасное состояние',
  'Data wiped': 'Данные очищены',
  'NullCal cleared local storage and caches. You are in a clean, offline-safe state.':
    'NullCal очистил локальное хранилище и кэши. Вы в чистом безопасном офлайн-состоянии.',
  'Status checklist': 'Контрольный список состояния',
  'Local data cleared': 'Локальные данные очищены',
  Confirmed: 'Подтверждено',
  'Offline mode': 'Офлайн-режим',
  ENFORCED: 'ПРИНУДИТЕЛЬНО',
  Sync: 'Синхронизация',
  OFF: 'ВЫКЛ',
  'Start fresh': 'Начать заново',
  'Re-import encrypted backup': 'Повторно импортировать зашифрованную резервную копию',
  'Import backup': 'Импортировать резервную копию',
  'Loading safety systems…': 'Загрузка систем безопасности…',
  Primary: 'Основной',
  None: 'Нет',
  Never: 'Никогда',
  'Safety Center': 'Центр безопасности',
  'Privacy & Security': 'Конфиденциальность и безопасность',
  'Security Score': 'Оценка безопасности',
  'Decentralized Sync': 'Децентрализованная синхронизация',
  'Enable decentralized sync': 'Включить децентрализованную синхронизацию',
  'Uses peer channels to sync profiles across devices.':
    'Использует одноранговые каналы для синхронизации профилей между устройствами.',
  'Sync strategy': 'Стратегия синхронизации',
  'Offline only': 'Только офлайн',
  'IPFS secure sync': 'Безопасная синхронизация IPFS',
  'Peer-to-peer mesh': 'Одноранговая mesh-сеть',
  'Trusted device sharing': 'Обмен для доверенных устройств',
  'Pair devices with end-to-end keys before sharing calendars.':
    'Сопрягайте устройства с end-to-end ключами перед обменом календарями.',
  'Trusted sync token': 'Токен доверенной синхронизации',
  Copy: 'Копировать',
  Regenerate: 'Сгенерировать заново',
  'Tamper-proof event log': 'Защищенный от подделки журнал событий',
  'Anchor event hashes for integrity checks.': 'Фиксируйте хэши событий для проверки целостности.',
  'Smart cache': 'Умный кэш',
  'Cache recent state for faster startup.': 'Кэшировать последнее состояние для быстрого запуска.',
  'Cache TTL (minutes)': 'TTL кэша (минуты)',
  Authentication: 'Аутентификация',
  'Two-factor authentication': 'Двухфакторная аутентификация',
  'Add SMS/email or authenticator app verification before unlocking.':
    'Добавьте проверку по SMS/email или приложению-аутентификатору перед разблокировкой.',
  Enabled: 'Включено',
  Disabled: 'Отключено',
  'MFA method': 'Метод MFA',
  'SMS or email code': 'Код по SMS или email',
  'Authenticator app (TOTP)': 'Приложение-аутентификатор (TOTP)',
  'Delivery channel': 'Канал доставки',
  Email: 'Email',
  SMS: 'SMS',
  'Email address': 'Email-адрес',
  'Phone number': 'Номер телефона',
  'Send code': 'Отправить код',
  'Verification code': 'Код подтверждения',
  'Verify & enable': 'Проверить и включить',
  'Generate secret': 'Сгенерировать секрет',
  'Setup key': 'Ключ настройки',
  'Authenticator code': 'Код аутентификатора',
  AUTHENTICATOR: 'АУТЕНТИФИКАТОР',
  'Disable 2FA': 'Отключить 2FA',
  'Biometric unlock': 'Биометрическая разблокировка',
  'Enable fingerprint or Face ID on supported devices.':
    'Включить отпечаток пальца или Face ID на поддерживаемых устройствах.',
  'Local passphrase': 'Локальный пароль',
  'Protect the app with a local-only passphrase.': 'Защитить приложение локальным паролем.',
  'Disable passphrase': 'Отключить пароль',
  'Passkey authentication': 'Аутентификация по ключу доступа',
  'Use WebAuthn for device-bound login.': 'Использовать WebAuthn для входа, привязанного к устройству.',
  'Register passkey': 'Зарегистрировать ключ доступа',
  'Remove passkey': 'Удалить ключ доступа',
  'Profile customization': 'Настройка профиля',
  'Avatar emoji': 'Эмодзи аватара',
  'Profile avatar preview': 'Предпросмотр аватара профиля',
  'Avatar color': 'Цвет аватара',
  Accessibility: 'Доступность',
  'High contrast': 'Высокая контрастность',
  'Boost contrast for low-vision readability.': 'Повысить контраст для слабовидящих.',
  'Text size': 'Размер текста',
  'Keyboard navigation': 'Навигация с клавиатуры',
  'Highlight focus rings for keyboard users.': 'Подсветка фокуса для пользователей клавиатуры.',
  'Private Notes & Sharing': 'Приватные заметки и обмен',
  'Wrap event files with local encryption.': 'Защитить файлы событий локальным шифрованием.',
  'Encrypted event sharing': 'Зашифрованный обмен событиями',
  'Share calendars with recipient-only keys.': 'Делитесь календарями с ключами только для получателя.',
  'Share token': 'Токен обмена',
  'Obfuscate event details': 'Скрывать детали событий',
  'Show time blocks instead of titles in the grid.': 'Показывать временные блоки вместо названий в сетке.',
  'Reminders & Collaboration': 'Напоминания и совместная работа',
  'Trigger notifications on this device.': 'Запускать уведомления на этом устройстве.',
  'Uses the notification gateway (Twilio/Nodemailer) configured on the backend.':
    'Использует шлюз уведомлений (Twilio/Nodemailer), настроенный на сервере.',
  Collaboration: 'Совместная работа',
  'Enable real-time updates via peer channels.': 'Включить обновления в реальном времени через peer-каналы.',
  'Collaboration mode': 'Режим совместной работы',
  'Private only': 'Только приватно',
  'Shared with trusted group': 'Общий доступ для доверенной группы',
  'Collaborative workspace': 'Совместное рабочее пространство',
  'Shared calendars remain encrypted; only approved collaborators can decrypt events.':
    'Общие календари остаются зашифрованными; расшифровать события могут только одобренные участники.',
  'Privacy Status': 'Статус конфиденциальности',
  'Privacy level': 'Уровень конфиденциальности',
  High: 'Высокий',
  Moderate: 'Средний',
  Basic: 'Базовый',
  Coverage: 'Покрытие',
  View: 'Открыть',
  'Security Checklist': 'Контрольный список безопасности',
  'Coverage score': 'Оценка покрытия',
  Off: 'Выкл',
  Locking: 'Блокировка',
  'Lock now': 'Заблокировать',
  'Immediately hides the calendar until you unlock.': 'Немедленно скрывает календарь до разблокировки.',
  'Set PIN': 'Установить PIN',
  'New PIN': 'Новый PIN',
  'Save PIN': 'Сохранить PIN',
  'Clear PIN': 'Очистить PIN',
  'Auto-lock (minutes)': 'Автоблокировка (минуты)',
  'Set to 0 to disable inactivity lock.': 'Установите 0, чтобы отключить блокировку по неактивности.',
  'Auto-lock on tab blur': 'Автоблокировка при потере фокуса вкладки',
  'Grace period': 'Льготный период',
  'Switch to decoy on blur': 'Переключаться на приманку при потере фокуса',
  'Select a decoy profile to enable this option.': 'Выберите профиль-приманку, чтобы включить эту опцию.',
  'Screen Privacy': 'Экранная конфиденциальность',
  'Secure mode': 'Безопасный режим',
  'Hides event titles until hover or focus to deter shoulder-surfing. Not encryption.':
    'Скрывает названия событий до наведения или фокуса, чтобы затруднить подсматривание. Это не шифрование.',
  'Blur sensitive': 'Размытие чувствительных данных',
  'Blurs titles until hover.': 'Размывает названия до наведения.',
  'Privacy screen hotkey': 'Горячая клавиша экрана приватности',
  'Cmd/Ctrl+Shift+P toggles a decoy overlay.': 'Cmd/Ctrl+Shift+P переключает маскирующий оверлей.',
  'Exit privacy screen': 'Выйти из режима приватности',
  'Activate privacy screen': 'Включить режим приватности',
  Appearance: 'Внешний вид',
  'Theme Packs': 'Тематические наборы',
  'Pick a theme to restyle the entire interface. Saved locally on this device.':
    'Выберите тему для изменения интерфейса. Настройка хранится локально на этом устройстве.',
  'Event export': 'Экспорт событий',
  Format: 'Формат',
  'Export events': 'Экспортировать события',
  'Exports only events in the active profile.': 'Экспортируются только события активного профиля.',
  'Audit log': 'Журнал аудита',
  'No audit entries yet.': 'Записей аудита пока нет.',
  'Export log': 'Экспорт журнала',
  'Clear log': 'Очистить журнал',
  'Stored locally for offline review.': 'Хранится локально для офлайн-проверки.',
  'Export Hygiene': 'Гигиена экспорта',
  'Full export': 'Полный экспорт',
  'Clean export': 'Очищенный экспорт',
  'Minimal export': 'Минимальный экспорт',
  'Complete profile export (calendars, events, preferences).':
    'Полный экспорт профиля (календари, события, настройки).',
  'Removes notes, locations, attendees; titles become “Busy” unless kept.':
    'Удаляет заметки, места и участников; названия становятся «Занято», если не сохранять.',
  'Only time blocks and category labels (no notes/locations).':
    'Только временные блоки и категории (без заметок/локаций).',
  'Keep titles (still removes notes/location/attendees)': 'Сохранять названия (заметки/локации/участники удаляются)',
  'Exports are files; handle them like secrets.': 'Экспорты — это файлы, обращайтесь с ними как с секретами.',
  'Export encrypted': 'Экспортировать зашифрованным',
  'Quick export': 'Быстрый экспорт',
  'Prompt for a passphrase and export immediately.': 'Запросить пароль и сразу экспортировать.',
  'Import Backup': 'Импорт резервной копии',
  Import: 'Импорт',
  'Decoy Profile': 'Профиль-приманка',
  'Decoy profile is a separate local workspace. Use a decoy PIN to open it under pressure.':
    'Профиль-приманка — отдельная локальная рабочая область. Используйте PIN приманки в стрессовой ситуации.',
  'Active profile': 'Активный профиль',
  Unknown: 'Неизвестно',
  'Decoy profile': 'Профиль-приманка',
  Configured: 'Настроен',
  'Not created': 'Не создан',
  'Choose decoy profile': 'Выберите профиль-приманку',
  'No decoy profile': 'Без профиля-приманки',
  'Use a profile with minimal data for safe handoff.':
    'Используйте профиль с минимальными данными для безопасной передачи.',
  'Decoy readiness': 'Готовность приманки',
  Ready: 'Готово',
  Pending: 'Ожидание',
  'Open decoy workspace': 'Открыть рабочую область приманки',
  'Profile actions': 'Действия профиля',
  'Create decoy shell': 'Создать оболочку-приманку',
  'Switch to decoy': 'Переключиться на приманку',
  'Switch to primary': 'Переключиться на основной',
  'Set decoy PIN': 'Установить PIN приманки',
  'Decoy PIN': 'PIN приманки',
  'Enter PIN': 'Введите PIN',
  'Confirm decoy PIN': 'Подтвердите PIN приманки',
  'Save decoy PIN': 'Сохранить PIN приманки',
  'Clear decoy PIN': 'Очистить PIN приманки',
  'Panic Wipe': 'Экстренное стирание',
  'Wipes IndexedDB, localStorage, and cache data on this device. This action is irreversible.':
    'Стирает IndexedDB, localStorage и кэш на этом устройстве. Действие необратимо.',
  'Open panic wipe': 'Открыть экстренное стирание',
  'Confirm panic wipe': 'Подтвердить экстренное стирание',
  'Hold the button for 2 seconds to wipe all local NullCAL data. This cannot be undone.':
    'Удерживайте кнопку 2 секунды, чтобы стереть все локальные данные NullCAL. Это нельзя отменить.',
  'Hold to wipe': 'Удерживать для стирания',
  Current: 'Текущая',
  'Select a theme pack to restyle the entire interface.':
    'Выберите тематический набор для изменения всего интерфейса.',
  Hotkeys: 'Горячие клавиши',
  'Quick command reference': 'Справка по быстрым командам',
  'Close hotkeys': 'Закрыть горячие клавиши',
  'Privacy Screen: Cmd/Ctrl+Shift+P (works even when unfocused)':
    'Экран приватности: Cmd/Ctrl+Shift+P (работает даже без фокуса)',
  'Focus search': 'Фокус на поиске',
  'Previous period': 'Предыдущий период',
  'Next period': 'Следующий период',
  'Privacy screen': 'Экран приватности',
  'Decoy profile': 'Профиль-приманка',
  'Quick export': 'Быстрый экспорт',
  'Open hotkeys': 'Открыть горячие клавиши',
  'Invalid credentials': 'Неверные учетные данные',
  'Passkey authentication failed.': 'Ошибка аутентификации ключом доступа.',
  'Biometric authentication failed.': 'Ошибка биометрической аутентификации.',
  'Invalid verification code.': 'Неверный код подтверждения.',
  PIN: 'PIN',
  'Secure Lock': 'Безопасная блокировка',
  'NullCAL Locked': 'NullCAL заблокирован',
  'Enter your authenticator code to finish unlocking.':
    'Введите код аутентификатора для завершения разблокировки.',
  'Enter your verification code to finish unlocking.': 'Введите код подтверждения для завершения разблокировки.',
  'Enter your PIN to continue.': 'Введите PIN, чтобы продолжить.',
  'Enter your passphrase to continue.': 'Введите пароль, чтобы продолжить.',
  'Tap unlock to resume.': 'Нажмите «Разблокировать», чтобы продолжить.',
  Unlock: 'Разблокировать',
  'Verify code': 'Проверить код',
  'Use passkey': 'Использовать ключ доступа',
  'Use biometric unlock': 'Использовать биометрическую разблокировку',
  'Resend code': 'Отправить код повторно',
  'Open system snapshot': 'Открыть системный снимок',
  'NullID Terminal': 'Терминал NullID',
  'NullID Terminal:': 'Терминал NullID:',
  connected: 'подключено',
  'IP (masked):': 'IP (скрыт):',
  'Uptime:': 'Время работы:',
  'Browser:': 'Браузер:',
  'User agent:': 'User agent:',
  'Platform:': 'Платформа:',
  'OS:': 'ОС:',
  'Locale:': 'Локаль:',
  'Screen:': 'Экран:',
  'Memory:': 'Память:',
  Unavailable: 'Недоступно',
  'CPU cores:': 'Ядра CPU:',
  'Color depth:': 'Глубина цвета:',
  'Connection:': 'Соединение:',
  'Secure mode:': 'Безопасный режим:',
  'Privacy note: data is local-only, masked, and non-identifiable. No personal data is stored or transmitted.':
    'Примечание о приватности: данные только локальные, маскированные и неидентифицируемые. Личные данные не сохраняются и не передаются.',
  'Touch device': 'Сенсорное устройство',
  Desktop: 'Компьютер',
  Windows: 'Windows',
  macOS: 'macOS',
  Linux: 'Linux',
  Android: 'Android',
  iOS: 'iOS',
  'Microsoft Edge': 'Microsoft Edge',
  Chrome: 'Chrome',
  Safari: 'Safari',
  Firefox: 'Firefox',
  Dark: 'Темная',
  Light: 'Светлая',
  'Show less': 'Показать меньше',
  'Browse all': 'Показать все',
  'A minimal, neon-forward calendar experience shaped for focus and clarity.':
    'Минималистичный календарь в неоновой эстетике для фокуса и ясности.',
  'Designed by Kamran Boroomand.': 'Дизайн: Kamran Boroomand.',
  '© 2024 NullCAL. All rights reserved.': '© 2024 NullCAL. Все права защищены.'
};

const faLiterals: LiteralDictionary = {
  'NullCal — Calendar': 'نال‌کل — تقویم',
  'NullCal — Safety Center': 'نال‌کل — مرکز امنیت',
  'NullCal hit an unexpected error': 'NullCal با یک خطای غیرمنتظره مواجه شد',
  'Something went wrong while loading this route. Try reloading the page.':
    'هنگام بارگذاری این مسیر مشکلی رخ داد. صفحه را دوباره بارگذاری کنید.',
  'Something went wrong while rendering this view. Reload the page to try again.':
    'در نمایش این صفحه مشکلی رخ داد. صفحه را دوباره بارگذاری کنید.',
  'Debug details': 'جزئیات اشکال‌زدایی',
  Reload: 'بارگذاری مجدد',
  'Profile name': 'نام نمایه',
  'Decoy profile name': 'نام نمایه فریب',
  Decoy: 'فریب',
  'Reset this profile back to default calendars (events removed)?':
    'این نمایه به تقویم‌های پیش‌فرض بازنشانی شود؟ (رویدادها حذف می‌شوند)',
  'Untitled event': 'رویداد بدون عنوان',
  'Passphrases do not match.': 'عبارت‌های عبور یکسان نیستند.',
  'Failed to encrypt note.': 'رمزگذاری یادداشت ناموفق بود.',
  'Template name is required.': 'نام الگو لازم است.',
  'Template saved.': 'الگو ذخیره شد.',
  'Failed to decrypt note.': 'رمزگشایی یادداشت ناموفق بود.',
  'Create a passphrase to encrypt this backup.': 'برای رمزگذاری این پشتیبان یک عبارت عبور بسازید.',
  'Encrypted backup exported.': 'پشتیبان رمزگذاری‌شده صادر شد.',
  'Export failed. Try again.': 'خروجی گرفتن ناموفق بود. دوباره تلاش کنید.',
  'No profile data available to export.': 'داده‌ای از نمایه برای خروجی وجود ندارد.',
  'Create a passphrase for the full export.': 'برای خروجی کامل یک عبارت عبور بسازید.',
  'Create a passphrase for the clean export.': 'برای خروجی پاک یک عبارت عبور بسازید.',
  'Create a passphrase for the minimal export.': 'برای خروجی حداقلی یک عبارت عبور بسازید.',
  'Full export saved.': 'خروجی کامل ذخیره شد.',
  'Clean export saved.': 'خروجی پاک ذخیره شد.',
  'No profile data available.': 'داده نمایه موجود نیست.',
  'Set a decoy profile in Safety Center.': 'در مرکز امنیت یک نمایه فریب تنظیم کنید.',
  'Unlock to switch profiles.': 'برای تغییر نمایه، قفل را باز کنید.',
  'Switched to decoy profile.': 'به نمایه فریب سوئیچ شد.',
  'Enter your backup passphrase.': 'عبارت عبور پشتیبان را وارد کنید.',
  'Backup imported successfully.': 'پشتیبان با موفقیت وارد شد.',
  'Import failed. Check your passphrase.': 'درون‌ریزی ناموفق بود. عبارت عبور را بررسی کنید.',
  events: 'رویداد',
  'Edit event': 'ویرایش رویداد',
  'New event': 'رویداد جدید',
  Template: 'الگو',
  'Select a template': 'یک الگو انتخاب کنید',
  Label: 'برچسب',
  'Focus, Travel, Deep work': 'تمرکز، سفر، کار عمیق',
  Icon: 'آیکن',
  'FREQ=MONTHLY;INTERVAL=1': 'FREQ=MONTHLY;INTERVAL=1',
  'Custom reminder': 'یادآور سفارشی',
  'Minutes before': 'دقیقه قبل',
  min: 'دقیقه',
  'alex@example.com, +1 555 0110': 'alex@example.com, +1 555 0110',
  'Encrypted note (unlock to view)': 'یادداشت رمزگذاری‌شده (برای مشاهده باز کنید)',
  'Add notes': 'افزودن یادداشت',
  'Encrypt notes': 'رمزگذاری یادداشت‌ها',
  'Passphrase to decrypt': 'عبارت عبور برای رمزگشایی',
  'Unlock note': 'باز کردن یادداشت',
  Passphrase: 'عبارت عبور',
  'Confirm passphrase': 'تأیید عبارت عبور',
  'Notes are encrypted locally with AES-GCM before being stored when this toggle is on.':
    'وقتی این گزینه روشن باشد، یادداشت‌ها پیش از ذخیره به‌صورت محلی با AES-GCM رمزگذاری می‌شوند.',
  'Event templates': 'الگوهای رویداد',
  'Template name': 'نام الگو',
  'Save template': 'ذخیره الگو',
  Delete: 'حذف',
  'Templates capture durations, labels, and reminders for quick reuse.':
    'الگوها مدت‌زمان، برچسب و یادآورها را برای استفاده سریع نگه می‌دارند.',
  Cancel: 'لغو',
  Reminders: 'یادآورها',
  'Enable reminders': 'فعال‌سازی یادآورها',
  'Show device notifications for upcoming events.': 'اعلان‌های دستگاه را برای رویدادهای پیش‌رو نشان بده.',
  'Reminder channel': 'کانال یادآور',
  'Local notifications': 'اعلان‌های محلی',
  'Push notifications': 'اعلان‌های پوش',
  'Email notifications': 'اعلان‌های ایمیلی',
  'SMS notifications': 'اعلان‌های پیامکی',
  'Signal secure ping': 'پینگ امن Signal',
  'Telegram secure ping': 'پینگ امن Telegram',
  'Notification email': 'ایمیل اعلان',
  'Notification phone': 'تلفن اعلان',
  'Uses the configured notification service for real SMS/email delivery.':
    'برای ارسال واقعی SMS/Email از سرویس اعلان پیکربندی‌شده استفاده می‌کند.',
  'Telegram bot token': 'توکن ربات تلگرام',
  'Telegram chat ID': 'شناسه چت تلگرام',
  'Signal webhook URL': 'آدرس webhook سیگنال',
  Notes: 'یادداشت‌ها',
  'Private notes': 'یادداشت‌های خصوصی',
  'Encrypted notes by default': 'یادداشت‌ها به‌صورت پیش‌فرض رمزگذاری شوند',
  'Encrypt notes locally with AES-GCM.': 'یادداشت‌ها را به‌صورت محلی با AES-GCM رمزگذاری کنید.',
  'Encrypted attachments': 'پیوست‌های رمزگذاری‌شده',
  'Protect files attached to events.': 'فایل‌های پیوست‌شده به رویدادها را محافظت کن.',
  'At time of event': 'هم‌زمان با رویداد',
  '5 minutes before': '۵ دقیقه قبل',
  '15 minutes before': '۱۵ دقیقه قبل',
  '30 minutes before': '۳۰ دقیقه قبل',
  '1 hour before': '۱ ساعت قبل',
  '1 day before': '۱ روز قبل',
  'Active profile was missing. Switched to the first available profile.':
    'نمایه فعال وجود نداشت. به اولین نمایه موجود سوئیچ شد.',
  'No profiles found. Created a default profile.': 'هیچ نمایه‌ای پیدا نشد. یک نمایه پیش‌فرض ساخته شد.',
  'Unable to export: profile data is missing.': 'امکان خروجی گرفتن نیست: داده نمایه موجود نیست.',
  'Export failed.': 'خروجی گرفتن ناموفق بود.',
  'Import failed.': 'درون‌ریزی ناموفق بود.',
  'Select a file and passphrase.': 'یک فایل و عبارت عبور انتخاب کنید.',
  'PINs do not match.': 'پین‌ها یکسان نیستند.',
  'PIN set. Lock screen enabled.': 'پین تنظیم شد. صفحه قفل فعال شد.',
  'Decoy PINs do not match.': 'پین‌های فریب یکسان نیستند.',
  'Create a decoy profile first.': 'ابتدا یک نمایه فریب بسازید.',
  'Decoy PIN set.': 'پین فریب تنظیم شد.',
  'Local passphrase enabled.': 'عبارت عبور محلی فعال شد.',
  'Local passphrase cleared.': 'عبارت عبور محلی پاک شد.',
  'WebAuthn is not supported on this device.': 'WebAuthn در این دستگاه پشتیبانی نمی‌شود.',
  'Passkey registered.': 'Passkey ثبت شد.',
  'Passkey registration failed.': 'ثبت Passkey ناموفق بود.',
  'Passkey removed.': 'Passkey حذف شد.',
  'Biometric unlock disabled.': 'بازکردن بیومتریک غیرفعال شد.',
  'Biometric unlock is not supported on this device.': 'بازکردن بیومتریک در این دستگاه پشتیبانی نمی‌شود.',
  'Biometric unlock enabled.': 'بازکردن بیومتریک فعال شد.',
  'Biometric setup failed.': 'راه‌اندازی بیومتریک ناموفق بود.',
  'Add a destination for the verification code.': 'یک مقصد برای کد تأیید اضافه کنید.',
  'Verification code sent.': 'کد تأیید ارسال شد.',
  'Unable to send verification code.': 'ارسال کد تأیید ناموفق بود.',
  'Invalid or expired code.': 'کد نامعتبر یا منقضی است.',
  'Two-factor authentication enabled.': 'احراز هویت دومرحله‌ای فعال شد.',
  'Two-factor setup failed.': 'راه‌اندازی احراز هویت دومرحله‌ای ناموفق بود.',
  'Authenticator secret generated.': 'کلید مخفی Authenticator تولید شد.',
  'Generate a secret first.': 'ابتدا یک کلید مخفی تولید کنید.',
  'Invalid authenticator code.': 'کد Authenticator نامعتبر است.',
  'Authenticator app enabled.': 'برنامه Authenticator فعال شد.',
  'Two-factor authentication disabled.': 'احراز هویت دومرحله‌ای غیرفعال شد.',
  'Authenticator app disabled.': 'برنامه Authenticator غیرفعال شد.',
  'Decentralized sync enabled.': 'همگام‌سازی غیرمتمرکز فعال شد.',
  'Decentralized sync disabled.': 'همگام‌سازی غیرمتمرکز غیرفعال شد.',
  'Trusted device sharing enabled.': 'اشتراک‌گذاری دستگاه‌های مورد اعتماد فعال شد.',
  'Trusted device sharing disabled.': 'اشتراک‌گذاری دستگاه‌های مورد اعتماد غیرفعال شد.',
  'Sync token copied.': 'توکن همگام‌سازی کپی شد.',
  'Unable to copy sync token.': 'کپی توکن همگام‌سازی ناموفق بود.',
  'Notifications are not supported on this device.': 'اعلان‌ها در این دستگاه پشتیبانی نمی‌شوند.',
  'Reminders enabled.': 'یادآورها فعال شدند.',
  'Reminders disabled.': 'یادآورها غیرفعال شدند.',
  'Profile updated.': 'نمایه به‌روزرسانی شد.',
  'Please upload an image file.': 'لطفا یک فایل تصویری بارگذاری کنید.',
  'Avatar image must be under 1MB.': 'تصویر آواتار باید کمتر از ۱ مگابایت باشد.',
  'Event export saved.': 'خروجی رویداد ذخیره شد.',
  'Audit log exported.': 'گزارش ممیزی صادر شد.',
  'Collaboration enabled.': 'همکاری فعال شد.',
  'Collaboration disabled.': 'همکاری غیرفعال شد.',
  'Secure sharing enabled.': 'اشتراک‌گذاری امن فعال شد.',
  'Secure sharing disabled.': 'اشتراک‌گذاری امن غیرفعال شد.',
  'Share token copied.': 'توکن اشتراک‌گذاری کپی شد.',
  'Unable to copy token.': 'کپی توکن ناموفق بود.',
  'Decoy profile already exists.': 'نمایه فریب از قبل وجود دارد.',
  'Decoy profile cleared.': 'نمایه فریب پاک شد.',
  'Decoy profile updated.': 'نمایه فریب به‌روزرسانی شد.',
  'Profile switching is tied to your PIN unlock.': 'تغییر نمایه به باز کردن پین شما وابسته است.',
  'Audit log cleared.': 'گزارش ممیزی پاک شد.',
  'Set a decoy profile first.': 'ابتدا یک نمایه فریب تنظیم کنید.',
  'Switch active profile?': 'نمایه فعال تغییر کند؟',
  'Safe State': 'وضعیت ایمن',
  'Data wiped': 'داده‌ها پاک شدند',
  'NullCal cleared local storage and caches. You are in a clean, offline-safe state.':
    'NullCal حافظه محلی و کش‌ها را پاک کرد. اکنون در وضعیت ایمن آفلاین هستید.',
  'Status checklist': 'فهرست وضعیت',
  'Local data cleared': 'داده محلی پاک شد',
  Confirmed: 'تأیید شد',
  'Offline mode': 'حالت آفلاین',
  ENFORCED: 'اجباری',
  Sync: 'همگام‌سازی',
  OFF: 'خاموش',
  'Start fresh': 'شروع تازه',
  'Re-import encrypted backup': 'درون‌ریزی دوباره پشتیبان رمزگذاری‌شده',
  'Import backup': 'درون‌ریزی پشتیبان',
  'Loading safety systems…': 'در حال بارگذاری سامانه‌های امنیتی…',
  Primary: 'اصلی',
  None: 'هیچ‌کدام',
  Never: 'هرگز',
  'Safety Center': 'مرکز امنیت',
  'Privacy & Security': 'حریم خصوصی و امنیت',
  'Security Score': 'امتیاز امنیت',
  'Decentralized Sync': 'همگام‌سازی غیرمتمرکز',
  'Enable decentralized sync': 'فعال‌سازی همگام‌سازی غیرمتمرکز',
  'Uses peer channels to sync profiles across devices.':
    'از کانال‌های همتا برای همگام‌سازی نمایه‌ها بین دستگاه‌ها استفاده می‌کند.',
  'Sync strategy': 'راهبرد همگام‌سازی',
  'Offline only': 'فقط آفلاین',
  'IPFS secure sync': 'همگام‌سازی امن IPFS',
  'Peer-to-peer mesh': 'مش همتا به همتا',
  'Trusted device sharing': 'اشتراک‌گذاری دستگاه مورد اعتماد',
  'Pair devices with end-to-end keys before sharing calendars.':
    'پیش از اشتراک‌گذاری تقویم، دستگاه‌ها را با کلیدهای end-to-end جفت کنید.',
  'Trusted sync token': 'توکن همگام‌سازی مورد اعتماد',
  Copy: 'کپی',
  Regenerate: 'تولید دوباره',
  'Tamper-proof event log': 'گزارش رویداد غیرقابل‌دستکاری',
  'Anchor event hashes for integrity checks.': 'هش رویدادها را برای بررسی یکپارچگی ثبت کنید.',
  'Smart cache': 'کش هوشمند',
  'Cache recent state for faster startup.': 'آخرین وضعیت را برای شروع سریع‌تر کش کن.',
  'Cache TTL (minutes)': 'TTL کش (دقیقه)',
  Authentication: 'احراز هویت',
  'Two-factor authentication': 'احراز هویت دومرحله‌ای',
  'Add SMS/email or authenticator app verification before unlocking.':
    'قبل از باز کردن قفل، تأیید SMS/Email یا برنامه Authenticator را اضافه کنید.',
  Enabled: 'فعال',
  Disabled: 'غیرفعال',
  'MFA method': 'روش MFA',
  'SMS or email code': 'کد پیامک یا ایمیل',
  'Authenticator app (TOTP)': 'برنامه Authenticator (TOTP)',
  'Delivery channel': 'کانال ارسال',
  Email: 'ایمیل',
  SMS: 'پیامک',
  'Email address': 'آدرس ایمیل',
  'Phone number': 'شماره تلفن',
  'Send code': 'ارسال کد',
  'Verification code': 'کد تأیید',
  'Verify & enable': 'تأیید و فعال‌سازی',
  'Generate secret': 'تولید کلید مخفی',
  'Setup key': 'کلید راه‌اندازی',
  'Authenticator code': 'کد Authenticator',
  AUTHENTICATOR: 'AUTHENTICATOR',
  'Disable 2FA': 'غیرفعال‌سازی 2FA',
  'Biometric unlock': 'بازکردن بیومتریک',
  'Enable fingerprint or Face ID on supported devices.':
    'اثر انگشت یا Face ID را روی دستگاه‌های پشتیبانی‌شده فعال کنید.',
  'Local passphrase': 'عبارت عبور محلی',
  'Protect the app with a local-only passphrase.': 'برنامه را با یک عبارت عبور محلی محافظت کنید.',
  'Disable passphrase': 'غیرفعال‌سازی عبارت عبور',
  'Passkey authentication': 'احراز هویت با Passkey',
  'Use WebAuthn for device-bound login.': 'از WebAuthn برای ورود وابسته به دستگاه استفاده کنید.',
  'Register passkey': 'ثبت Passkey',
  'Remove passkey': 'حذف Passkey',
  'Profile customization': 'شخصی‌سازی نمایه',
  'Avatar emoji': 'ایموجی آواتار',
  'Profile avatar preview': 'پیش‌نمایش آواتار نمایه',
  'Avatar color': 'رنگ آواتار',
  Accessibility: 'دسترس‌پذیری',
  'High contrast': 'کنتراست بالا',
  'Boost contrast for low-vision readability.': 'کنتراست را برای خوانایی افراد کم‌بینا افزایش بده.',
  'Text size': 'اندازه متن',
  'Keyboard navigation': 'ناوبری صفحه‌کلید',
  'Highlight focus rings for keyboard users.': 'حلقه‌های فوکوس را برای کاربران صفحه‌کلید برجسته کن.',
  'Private Notes & Sharing': 'یادداشت خصوصی و اشتراک‌گذاری',
  'Wrap event files with local encryption.': 'فایل‌های رویداد را با رمزگذاری محلی محافظت کن.',
  'Encrypted event sharing': 'اشتراک‌گذاری رویداد رمزگذاری‌شده',
  'Share calendars with recipient-only keys.': 'تقویم‌ها را با کلید مخصوص گیرنده به اشتراک بگذار.',
  'Share token': 'توکن اشتراک‌گذاری',
  'Obfuscate event details': 'پنهان‌سازی جزئیات رویداد',
  'Show time blocks instead of titles in the grid.': 'به‌جای عنوان، بلوک‌های زمانی را در شبکه نشان بده.',
  'Reminders & Collaboration': 'یادآورها و همکاری',
  'Trigger notifications on this device.': 'اعلان‌ها را روی این دستگاه فعال کن.',
  'Uses the notification gateway (Twilio/Nodemailer) configured on the backend.':
    'از درگاه اعلان پیکربندی‌شده در بک‌اند (Twilio/Nodemailer) استفاده می‌کند.',
  Collaboration: 'همکاری',
  'Enable real-time updates via peer channels.': 'به‌روزرسانی زنده را از طریق کانال‌های همتا فعال کن.',
  'Collaboration mode': 'حالت همکاری',
  'Private only': 'فقط خصوصی',
  'Shared with trusted group': 'اشتراک با گروه مورد اعتماد',
  'Collaborative workspace': 'فضای کاری مشارکتی',
  'Shared calendars remain encrypted; only approved collaborators can decrypt events.':
    'تقویم‌های اشتراکی رمزگذاری‌شده می‌مانند؛ فقط همکاران تأییدشده می‌توانند رویدادها را رمزگشایی کنند.',
  'Privacy Status': 'وضعیت حریم خصوصی',
  'Privacy level': 'سطح حریم خصوصی',
  High: 'بالا',
  Moderate: 'متوسط',
  Basic: 'پایه',
  Coverage: 'پوشش',
  View: 'نمایش',
  'Security Checklist': 'چک‌لیست امنیت',
  'Coverage score': 'امتیاز پوشش',
  Off: 'خاموش',
  Locking: 'قفل‌گذاری',
  'Lock now': 'قفل فوری',
  'Immediately hides the calendar until you unlock.': 'تا زمان بازکردن قفل، تقویم را فوراً پنهان می‌کند.',
  'Set PIN': 'تنظیم PIN',
  'New PIN': 'PIN جدید',
  'Save PIN': 'ذخیره PIN',
  'Clear PIN': 'پاک‌کردن PIN',
  'Auto-lock (minutes)': 'قفل خودکار (دقیقه)',
  'Set to 0 to disable inactivity lock.': 'برای غیرفعال‌سازی قفل عدم فعالیت، ۰ بگذارید.',
  'Auto-lock on tab blur': 'قفل خودکار هنگام خروج از تب',
  'Grace period': 'مهلت',
  'Switch to decoy on blur': 'هنگام خروج از تب به فریب سوئیچ شود',
  'Select a decoy profile to enable this option.': 'برای فعال‌سازی این گزینه یک نمایه فریب انتخاب کنید.',
  'Screen Privacy': 'حریم خصوصی صفحه',
  'Secure mode': 'حالت امن',
  'Hides event titles until hover or focus to deter shoulder-surfing. Not encryption.':
    'عنوان رویدادها را تا زمان hover یا focus پنهان می‌کند. این رمزگذاری نیست.',
  'Blur sensitive': 'تاری حساس',
  'Blurs titles until hover.': 'عنوان‌ها را تا زمان hover تار می‌کند.',
  'Privacy screen hotkey': 'میانبر صفحه حریم خصوصی',
  'Cmd/Ctrl+Shift+P toggles a decoy overlay.': 'کلید Cmd/Ctrl+Shift+P پوشش فریب را تغییر می‌دهد.',
  'Exit privacy screen': 'خروج از صفحه حریم خصوصی',
  'Activate privacy screen': 'فعال‌سازی صفحه حریم خصوصی',
  Appearance: 'ظاهر',
  'Theme Packs': 'بسته‌های تم',
  'Pick a theme to restyle the entire interface. Saved locally on this device.':
    'یک تم انتخاب کنید تا کل رابط تغییر کند. به‌صورت محلی روی این دستگاه ذخیره می‌شود.',
  'Event export': 'خروجی رویداد',
  Format: 'فرمت',
  'Export events': 'خروجی رویدادها',
  'Exports only events in the active profile.': 'فقط رویدادهای نمایه فعال خروجی گرفته می‌شوند.',
  'Audit log': 'گزارش ممیزی',
  'No audit entries yet.': 'هنوز ورودی ممیزی وجود ندارد.',
  'Export log': 'خروجی گزارش',
  'Clear log': 'پاک‌کردن گزارش',
  'Stored locally for offline review.': 'برای بررسی آفلاین به‌صورت محلی ذخیره می‌شود.',
  'Export Hygiene': 'بهداشت خروجی',
  'Full export': 'خروجی کامل',
  'Clean export': 'خروجی پاک',
  'Minimal export': 'خروجی حداقلی',
  'Complete profile export (calendars, events, preferences).':
    'خروجی کامل نمایه (تقویم‌ها، رویدادها، تنظیمات).',
  'Removes notes, locations, attendees; titles become “Busy” unless kept.':
    'یادداشت، مکان و شرکت‌کننده را حذف می‌کند؛ عنوان‌ها در صورت عدم نگهداری به «Busy» تبدیل می‌شوند.',
  'Only time blocks and category labels (no notes/locations).': 'فقط بلوک‌های زمانی و دسته‌بندی‌ها (بدون یادداشت/مکان).',
  'Keep titles (still removes notes/location/attendees)': 'حفظ عنوان‌ها (یادداشت/مکان/شرکت‌کننده حذف می‌شود)',
  'Exports are files; handle them like secrets.': 'خروجی‌ها فایل هستند؛ مثل داده محرمانه با آن‌ها رفتار کنید.',
  'Export encrypted': 'خروجی رمزگذاری‌شده',
  'Quick export': 'خروجی سریع',
  'Prompt for a passphrase and export immediately.': 'عبارت عبور بپرس و بلافاصله خروجی بگیر.',
  'Import Backup': 'درون‌ریزی پشتیبان',
  Import: 'درون‌ریزی',
  'Decoy Profile': 'نمایه فریب',
  'Decoy profile is a separate local workspace. Use a decoy PIN to open it under pressure.':
    'نمایه فریب یک فضای کاری محلی جداست. برای شرایط فشار از PIN فریب استفاده کنید.',
  'Active profile': 'نمایه فعال',
  Unknown: 'نامشخص',
  'Decoy profile': 'نمایه فریب',
  Configured: 'پیکربندی شده',
  'Not created': 'ایجاد نشده',
  'Choose decoy profile': 'انتخاب نمایه فریب',
  'No decoy profile': 'بدون نمایه فریب',
  'Use a profile with minimal data for safe handoff.': 'برای تحویل امن از نمایه با حداقل داده استفاده کنید.',
  'Decoy readiness': 'آمادگی فریب',
  Ready: 'آماده',
  Pending: 'در انتظار',
  'Open decoy workspace': 'بازکردن فضای کاری فریب',
  'Profile actions': 'اقدامات نمایه',
  'Create decoy shell': 'ایجاد پوسته فریب',
  'Switch to decoy': 'سوئیچ به فریب',
  'Switch to primary': 'سوئیچ به اصلی',
  'Set decoy PIN': 'تنظیم PIN فریب',
  'Decoy PIN': 'PIN فریب',
  'Enter PIN': 'PIN را وارد کنید',
  'Confirm decoy PIN': 'تأیید PIN فریب',
  'Save decoy PIN': 'ذخیره PIN فریب',
  'Clear decoy PIN': 'پاک‌کردن PIN فریب',
  'Panic Wipe': 'پاکسازی اضطراری',
  'Wipes IndexedDB, localStorage, and cache data on this device. This action is irreversible.':
    'IndexedDB، localStorage و کش این دستگاه را پاک می‌کند. این کار برگشت‌ناپذیر است.',
  'Open panic wipe': 'بازکردن پاکسازی اضطراری',
  'Confirm panic wipe': 'تأیید پاکسازی اضطراری',
  'Hold the button for 2 seconds to wipe all local NullCAL data. This cannot be undone.':
    'دکمه را ۲ ثانیه نگه دارید تا همه داده‌های محلی NullCAL پاک شود. این کار قابل بازگشت نیست.',
  'Hold to wipe': 'نگه‌دار برای پاکسازی',
  Current: 'فعلی',
  'Select a theme pack to restyle the entire interface.': 'یک بسته تم انتخاب کنید تا کل رابط تغییر کند.',
  Hotkeys: 'میانبرها',
  'Quick command reference': 'مرجع سریع فرمان‌ها',
  'Close hotkeys': 'بستن میانبرها',
  'Privacy Screen: Cmd/Ctrl+Shift+P (works even when unfocused)':
    'صفحه حریم خصوصی: Cmd/Ctrl+Shift+P (حتی بدون فوکوس هم کار می‌کند)',
  'Focus search': 'تمرکز روی جست‌وجو',
  'Previous period': 'بازه قبلی',
  'Next period': 'بازه بعدی',
  'Privacy screen': 'صفحه حریم خصوصی',
  'Open hotkeys': 'بازکردن میانبرها',
  'Invalid credentials': 'اعتبارنامعتبر',
  'Passkey authentication failed.': 'احراز هویت Passkey ناموفق بود.',
  'Biometric authentication failed.': 'احراز هویت بیومتریک ناموفق بود.',
  'Invalid verification code.': 'کد تأیید نامعتبر است.',
  PIN: 'پین',
  'Secure Lock': 'قفل امن',
  'NullCAL Locked': 'NullCAL قفل است',
  'Enter your authenticator code to finish unlocking.': 'برای پایان بازکردن قفل، کد Authenticator را وارد کنید.',
  'Enter your verification code to finish unlocking.': 'برای پایان بازکردن قفل، کد تأیید را وارد کنید.',
  'Enter your PIN to continue.': 'برای ادامه PIN را وارد کنید.',
  'Enter your passphrase to continue.': 'برای ادامه عبارت عبور را وارد کنید.',
  'Tap unlock to resume.': 'برای ادامه روی Unlock بزنید.',
  Unlock: 'بازکردن قفل',
  'Verify code': 'تأیید کد',
  'Use passkey': 'استفاده از Passkey',
  'Use biometric unlock': 'استفاده از بازکردن بیومتریک',
  'Resend code': 'ارسال دوباره کد',
  'Open system snapshot': 'بازکردن نمای کلی سیستم',
  'NullID Terminal': 'ترمینال NullID',
  'NullID Terminal:': 'ترمینال NullID:',
  connected: 'متصل',
  'IP (masked):': 'IP (پوشانده):',
  'Uptime:': 'زمان اجرا:',
  'Browser:': 'مرورگر:',
  'User agent:': 'عامل کاربر:',
  'Platform:': 'پلتفرم:',
  'OS:': 'سیستم‌عامل:',
  'Locale:': 'زبان/منطقه:',
  'Screen:': 'صفحه:',
  'Memory:': 'حافظه:',
  Unavailable: 'در دسترس نیست',
  'CPU cores:': 'هسته CPU:',
  'Color depth:': 'عمق رنگ:',
  'Connection:': 'اتصال:',
  'Secure mode:': 'حالت امن:',
  'Privacy note: data is local-only, masked, and non-identifiable. No personal data is stored or transmitted.':
    'یادداشت حریم خصوصی: داده‌ها فقط محلی، پوشانده و غیرقابل‌شناسایی هستند. هیچ داده شخصی ذخیره یا ارسال نمی‌شود.',
  'Touch device': 'دستگاه لمسی',
  Desktop: 'رومیزی',
  Windows: 'ویندوز',
  macOS: 'مک‌اواس',
  Linux: 'لینوکس',
  Android: 'اندروید',
  iOS: 'آی‌او‌اس',
  'Microsoft Edge': 'مایکروسافت اج',
  Chrome: 'کروم',
  Safari: 'سافاری',
  Firefox: 'فایرفاکس',
  Dark: 'تاریک',
  Light: 'روشن',
  'Show less': 'نمایش کمتر',
  'Browse all': 'نمایش همه',
  'A minimal, neon-forward calendar experience shaped for focus and clarity.':
    'یک تجربه تقویم مینیمال با سبک نئونی برای تمرکز و شفافیت.',
  'Designed by Kamran Boroomand.': 'طراحی‌شده توسط Kamran Boroomand.',
  '© 2024 NullCAL. All rights reserved.': '© 2024 NullCAL. تمامی حقوق محفوظ است.'
};

const literalTranslations: Record<Exclude<Language, 'en'>, LiteralDictionary> = {
  ru: ruLiterals,
  fa: faLiterals
};

const reverseMap = (dictionary: LiteralDictionary): LiteralDictionary =>
  Object.entries(dictionary).reduce<LiteralDictionary>((acc, [english, localized]) => {
    acc[localized] = english;
    return acc;
  }, {});

const reverseLiteralTranslations: Record<Exclude<Language, 'en'>, LiteralDictionary> = {
  ru: reverseMap(ruLiterals),
  fa: reverseMap(faLiterals)
};

const translateDynamic = (canonicalEnglish: string, language: Language): string | null => {
  if (language === 'en') {
    const restoreDeleteTemplate = canonicalEnglish.match(/^Delete "(.+)"\?$/);
    if (restoreDeleteTemplate) {
      return `Delete "${restoreDeleteTemplate[1]}"?`;
    }
    const restoreDeleteCalendar = canonicalEnglish.match(/^Delete (.+) and its events\?$/);
    if (restoreDeleteCalendar) {
      return `Delete ${restoreDeleteCalendar[1]} and its events?`;
    }
    const restoreThemePack = canonicalEnglish.match(/^(.+) theme pack$/);
    if (restoreThemePack) {
      return `${restoreThemePack[1]} theme pack`;
    }
    const restoreScale = canonicalEnglish.match(/^Scale:\s*([0-9.]+)x$/);
    if (restoreScale) {
      return `Scale: ${restoreScale[1]}x`;
    }
    const restoreEvents = canonicalEnglish.match(/^(\d+)\s+events$/);
    if (restoreEvents) {
      return `${restoreEvents[1]} events`;
    }
    return null;
  }

  const deleteTemplateMatch = canonicalEnglish.match(/^Delete "(.+)"\?$/);
  if (deleteTemplateMatch) {
    return language === 'ru' ? `Удалить "${deleteTemplateMatch[1]}"?` : `حذف "${deleteTemplateMatch[1]}"؟`;
  }

  const deleteCalendarMatch = canonicalEnglish.match(/^Delete (.+) and its events\?$/);
  if (deleteCalendarMatch) {
    return language === 'ru'
      ? `Удалить ${deleteCalendarMatch[1]} и его события?`
      : `${deleteCalendarMatch[1]} و رویدادهای آن حذف شود؟`;
  }

  const themePackMatch = canonicalEnglish.match(/^(.+) theme pack$/);
  if (themePackMatch) {
    return language === 'ru' ? `Тематический набор ${themePackMatch[1]}` : `بسته تم ${themePackMatch[1]}`;
  }

  const scaleMatch = canonicalEnglish.match(/^Scale:\s*([0-9.]+)x$/);
  if (scaleMatch) {
    return language === 'ru' ? `Масштаб: ${scaleMatch[1]}x` : `مقیاس: ${scaleMatch[1]}x`;
  }

  const eventsMatch = canonicalEnglish.match(/^(\d+)\s+events$/);
  if (eventsMatch) {
    return language === 'ru' ? `${eventsMatch[1]} событий` : `${eventsMatch[1]} رویداد`;
  }

  return null;
};

const normalizeLiteral = (value: string) => value.replace(/\s+/g, ' ').trim();

const toCanonicalEnglish = (value: string): string => {
  if (!value) {
    return value;
  }
  return reverseLiteralTranslations.ru[value] ?? reverseLiteralTranslations.fa[value] ?? value;
};

export const translateLiteral = (value: string, language: Language): string => {
  if (!value) {
    return value;
  }

  const normalized = normalizeLiteral(value);
  const canonicalEnglish = toCanonicalEnglish(normalized);

  const dynamic = translateDynamic(canonicalEnglish, language);
  if (dynamic) {
    return dynamic;
  }

  if (language === 'en') {
    return canonicalEnglish;
  }

  return literalTranslations[language][canonicalEnglish] ?? canonicalEnglish;
};

export const localizeDocumentLiterals = (root: ParentNode, language: Language) => {
  if (typeof document === 'undefined') {
    return;
  }

  const translateValue = (raw: string) => {
    const leading = raw.match(/^\s*/)?.[0] ?? '';
    const trailing = raw.match(/\s*$/)?.[0] ?? '';
    const core = raw.slice(leading.length, raw.length - trailing.length);
    if (!core) {
      return raw;
    }
    const translatedCore = translateLiteral(core, language);
    return `${leading}${translatedCore}${trailing}`;
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const value = node.nodeValue ?? '';
      if (!value.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let current: Node | null = walker.nextNode();
  while (current) {
    const nextValue = translateValue(current.nodeValue ?? '');
    if (nextValue !== current.nodeValue) {
      current.nodeValue = nextValue;
    }
    current = walker.nextNode();
  }

  if ('querySelectorAll' in root) {
    const elements = root.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title]');
    elements.forEach((element) => {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) {
        const translated = translateLiteral(placeholder, language);
        if (translated !== placeholder) {
          element.setAttribute('placeholder', translated);
        }
      }
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        const translated = translateLiteral(ariaLabel, language);
        if (translated !== ariaLabel) {
          element.setAttribute('aria-label', translated);
        }
      }
      const title = element.getAttribute('title');
      if (title) {
        const translated = translateLiteral(title, language);
        if (translated !== title) {
          element.setAttribute('title', translated);
        }
      }
    });
  }
};
