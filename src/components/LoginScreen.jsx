import { useState } from 'react';
import './LoginScreen.css';
import { apiGet, isAuthError } from '../lib/api.js';

/**
 * Экран авторизации: ввод X-API-Key, проверка ключа реальным
 * запросом к API и передача ключа наверх при успехе.
 *
 * @param {{ onSuccess: (apiKey: string) => void }} props
 */
export default function LoginScreen({ onSuccess }) {
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError('Введите X-API-Key');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Проверяем ключ боевым запросом к API
      await apiGet('/schedule/current-week', trimmedKey);
      onSuccess(trimmedKey);
    } catch (err) {
      if (isAuthError(err.status)) {
        setError('Неверный X-API-Key. Проверьте ключ и попробуйте снова.');
      } else {
        setError(`Не удалось проверить ключ: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">Расписание занятий</h1>
        <p className="login-subtitle">Для доступа к расписанию введите X-API-Key</p>

        <label className="login-label" htmlFor="api-key">
          X-API-Key
        </label>
        <input
          id="api-key"
          className="login-input"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Введите ваш ключ доступа"
          autoComplete="off"
          autoFocus
          spellCheck="false"
        />

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button className="login-button" type="submit" disabled={submitting}>
          {submitting ? 'Проверка ключа…' : 'Войти'}
        </button>

        <p className="login-hint">Ключ сохранится в этом браузере на 30 дней.</p>
      </form>
    </div>
  );
}