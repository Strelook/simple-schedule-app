// Клиент для Simple schedule API (https://simple-schedule-api.soltusaa.ru/docs)

export const API_BASE_URL = 'https://simple-schedule-api.soltusaa.ru';

/**
 * Ошибка запроса к API. Содержит HTTP-статус ответа.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Выполняет GET-запрос к API с заголовком X-API-Key.
 * @param {string} path - путь эндпоинта, например '/schedule/current-week'
 * @param {string} apiKey - X-API-Key
 * @returns {Promise<object>} распарсенный JSON-ответ
 * @throws {ApiError} при статусе ответа >= 400
 */
export async function apiGet(path, apiKey) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
  } catch {
    throw new ApiError('Нет соединения с сервером', 0);
  }

  if (!response.ok) {
    let detail = `Ошибка сервера: ${response.status}`;
    try {
      const body = await response.json();
      if (body && body.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // тело ответа не JSON — оставляем сообщение по умолчанию
    }
    throw new ApiError(detail, response.status);
  }

  return response.json();
}