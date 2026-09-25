import React, { useState, useEffect } from 'react';
import './Schedule.css';
import { getApiKey, saveApiKey, clearApiKey, isAuthError } from './auth.js';
import { apiGet } from './api.js';
import LoginScreen from './LoginScreen.jsx';
import TemplateEditor from './TemplateEditor.jsx';

// Задаем интервал обновления в секундах (5 минут = 300 секунд)
const UPDATE_INTERVAL_SEC = 300;

function App() {
  // X-API-Key из localStorage (с учётом срока действия 30 дней)
  const [apiKey, setApiKeyState] = useState(() => getApiKey());

  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Состояние для обратного отсчета (в секундах)
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL_SEC);

  // Текущий экран: 'schedule' — расписание, 'template' — редактор шаблона
  const [view, setView] = useState('schedule');

  const isAuthed = Boolean(apiKey);

  // Успешный вход: сохраняем ключ на 30 дней и показываем расписание
  const handleLogin = (key) => {
    saveApiKey(key);
    setApiKeyState(key);
    setView('schedule');
  };

  // Выход по кнопке пользователя
  const handleLogout = () => {
    clearApiKey();
    setApiKeyState(null);
    setScheduleData([]);
    setError(null);
    setView('schedule');
  };

  // Сброс авторизации: ключ не подходит (401/403) или истёк
  const handleAuthFailure = () => {
    clearApiKey();
    setApiKeyState(null);
    setScheduleData([]);
    setError(null);
    setView('schedule');
  };

  // Функция запроса к серверу
  const fetchSchedule = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await apiGet('/schedule/current-week', apiKey);
      setScheduleData(data);
      setError(null);

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Сбрасываем таймер обратно на 5 минут после успешного получения данных
      setCountdown(UPDATE_INTERVAL_SEC);
    } catch (err) {
      if (isAuthError(err.status)) {
        // API вернул 401/403 — ключ больше не подходит, просим ввести новый
        handleAuthFailure();
      } else {
        setError(err.message);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Эффект для загрузки данных при авторизации (первичной и после входа)
  useEffect(() => {
    if (apiKey) {
      fetchSchedule(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Эффект для ежесекундного тикания визуального таймера
  useEffect(() => {
    if (!apiKey) return undefined;

    const timerId = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          // Время вышло: запускаем тихое обновление данных
          console.log('Таймер дошел до 0. Обновляем данные...');
          fetchSchedule(true);
          return UPDATE_INTERVAL_SEC; // Возвращаем исходное значение
        }
        return prevCount - 1; // Уменьшаем на 1 секунду
      });
    }, 1000);

    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Функция форматирования секунд в красивый вид ММ:СС (например, 299 -> "04:59")
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const f_lower = (strD) => {//2222-22-22
    return strD.toLowerCase();
  };

  // Показываем экран входа, если нет действующего ключа
  if (!isAuthed) {
    return <LoginScreen onSuccess={handleLogin} />;
  }

  // Редактор шаблона расписания на неделю
  if (view === 'template') {
    return (
      <TemplateEditor
        apiKey={apiKey}
        onBack={() => setView('schedule')}
        onAuthFailure={handleAuthFailure}
      />
    );
  }

  if (loading) {
    return (
      <div className="schedule-container">
        <p>Загрузка расписания...</p>
      </div>
    );
  }

  if (error && scheduleData.length === 0) {
    return (
      <div className="schedule-container">
        <p style={{ color: 'red', fontWeight: 'bold' }}>Не удалось загрузить данные: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="schedule-header">
        <div className="schedule-header-info">
          {lastUpdated && <span className="schedule-last-updated">Обновлено: {lastUpdated}</span>}
          <span className="schedule-countdown">Обновление через: {formatCountdown(countdown)}</span>
        </div>
        <div className="schedule-header-actions">
          <button type="button" className="logout-button" onClick={() => setView('template')}>
            Редактировать шаблон
          </button>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Сменить ключ
          </button>
        </div>
      </div>

      <div class="schedReS">
        {scheduleData.map((day) => (
          <div key={day.date} className="day-container">

            {day.lessons.length === 0 ? (
              <table cellpadding="0px" cellspacing="0px" class="dayTable">
                <tbody>
                  <tr>
                    <td class="tdCapt" align="left" valign="middle" height="44px" colspan="3">
                      <div class="spanCapt">&nbsp;{f_lower(day.day_name)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="tdPair_3" align="left" valign="middle" height="177px" colspan="3">
                      <div className="no-lessons">Занятий нет</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="tdPair_4" align="center" valign="middle" height="20px" colspan="3">{formatDate(day.date)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table cellpadding="0px" cellspacing="0px" class="dayTable">
                <tbody>
                  <tr>
                    <td class="tdCapt" align="left" valign="middle" height="44px" colspan="3">
                      <div class="spanCapt">&nbsp;{f_lower(day.day_name)}</div>
                    </td>
                  </tr>

                  {day.lessons.map((lesson) => (
                    <tr key={lesson.lesson_number}>
                      <td class="tdPair_1" align="center" valign="middle">{lesson.lesson_number}</td>
                      <td class="tdPair_2" align="center" valign="middle">08:00 09:55</td>
                      <td class="tdPair_3" align="left" valign="middle">{lesson.subject}<br /><span class="prepod">{lesson.teacher}</span></td>
                    </tr>
                  ))}
                  <tr>
                    <td class="tdPair_4" align="center" valign="middle" height="20px" colspan="3">{formatDate(day.date)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
