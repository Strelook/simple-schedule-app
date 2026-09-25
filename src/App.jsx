import React, { useState, useEffect } from 'react';
import './Schedule.css';

// Задаем интервал обновления в секундах (5 минут = 300 секунд)
const UPDATE_INTERVAL_SEC = 300;

function App() {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Состояние для обратного отсчета (в секундах)
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL_SEC);

  // Функция запроса к серверу
  const fetchSchedule = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch('https://simple-schedule-api.soltusaa.ru/schedule/current-week', {
        method: 'GET',
        headers: {
          'X-API-Key': 's94513383ec990b9d94387d9416fb33a6',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      setScheduleData(data);
      setError(null);
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Сбрасываем таймер обратно на 5 минут после успешного получения данных
      setCountdown(UPDATE_INTERVAL_SEC); 
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Эффект для первоначальной загрузки данных
  useEffect(() => {
    fetchSchedule(false);
  }, []);

  // Эффект для ежесекундного тикания визуального таймера
  useEffect(() => {
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
  }, []);

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
  }

//timeLessonStr = (typeof lesson.lesson_number == "string")?" ":timeLesson[lesson.lesson_number];


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
  );
}

export default App;
