// Модуль хранения X-API-Key в localStorage с автоматическим устареванием.

const STORAGE_KEY = 'schedule_api_key';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

/**
 * Сохраняет API-ключ со сроком действия 30 дней.
 * @param {string} apiKey
 */
export function saveApiKey(apiKey) {
  const record = {
    value: apiKey,
    expiresAt: Date.now() + TTL_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/**
 * Возвращает сохранённый ключ, если он ещё не истёк, иначе null.
 * При истечении срока ключ автоматически удаляется из хранилища.
 * @returns {string|null}
 */
export function getApiKey() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const record = JSON.parse(raw);
    if (!record || typeof record.value !== 'string' || !record.value) {
      return null;
    }

    if (Date.now() >= record.expiresAt) {
      clearApiKey();
      return null;
    }

    return record.value;
  } catch {
    // Битые данные в хранилище — считаем, что ключа нет
    return null;
  }
}

/**
 * Удаляет API-ключ из хранилища.
 */
export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}