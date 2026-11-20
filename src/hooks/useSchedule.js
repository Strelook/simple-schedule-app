import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, isAuthError } from '../lib/api.js';

// Интервал автообновления расписания (5 минут)
const UPDATE_INTERVAL_SEC = 300;

/**
 * Загружает расписание текущей недели и автоматически обновляет его
 * каждые UPDATE_INTERVAL_SEC секунд.
 *
 * @param {string|null} apiKey X-API-Key; null — данные не загружаются
 * @param {{ onAuthFailure?: () => void }} [options]
 * @returns {{
 *   scheduleData: Array,
 *   loading: boolean,
 *   error: string|null,
 *   lastUpdated: string|null,
 *   countdown: number,
 * }}
 */
export default function useSchedule(apiKey, options = {}) {
  const { onAuthFailure } = options;

  const [scheduleData, setScheduleData] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL_SEC);

  // Ключ, для которого уже выполнена загрузка (успешная или нет).
  // Производное значение loading = true, пока загрузка для текущего ключа не завершена.
  const [attemptedKey, setAttemptedKey] = useState(null);
  const loading = Boolean(apiKey) && attemptedKey !== apiKey;

  // Ссылки на актуальные значения, чтобы таймер не зависел от устаревших замыканий
  const onAuthFailureRef = useRef(onAuthFailure);
  useEffect(() => {
    onAuthFailureRef.current = onAuthFailure;
  }, [onAuthFailure]);

  const countdownRef = useRef(countdown);
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  // Применение успешного ответа API к состоянию
  const applySchedule = useCallback((data) => {
    setScheduleData(data);
    setError(null);

    const now = new Date();
    setLastUpdated(
      now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    );
    // После успешной загрузки сбрасываем отсчёт на полный интервал
    setCountdown(UPDATE_INTERVAL_SEC);
  }, []);

  // Обработка ошибки запроса
  const applyError = useCallback((err) => {
    if (isAuthError(err.status)) {
      // API вернул 401/403 — ключ больше не подходит
      onAuthFailureRef.current?.();
    } else {
      setError(err.message);
    }
  }, []);

  // Первичная загрузка при авторизации (и после входа новым ключом)
  useEffect(() => {
    if (!apiKey) return undefined;

    let cancelled = false;
    apiGet('/schedule/current-week', apiKey)
      .then((data) => {
        if (!cancelled) applySchedule(data);
      })
      .catch((err) => {
        if (!cancelled) applyError(err);
      })
      .finally(() => {
        if (!cancelled) setAttemptedKey(apiKey);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, applySchedule, applyError]);

  // Ежесекундный отсчёт; по достижении нуля — тихое обновление данных
  useEffect(() => {
    if (!apiKey) return undefined;

    const timerId = setInterval(() => {
      if (countdownRef.current <= 1) {
        // Время вышло: сбрасываем отсчёт и запускаем тихое обновление
        setCountdown(UPDATE_INTERVAL_SEC);
        apiGet('/schedule/current-week', apiKey)
          .then((data) => applySchedule(data))
          .catch((err) => applyError(err));
      } else {
        setCountdown((prevCount) => prevCount - 1);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [apiKey, applySchedule, applyError]);

  return { scheduleData, loading, error, lastUpdated, countdown };
}