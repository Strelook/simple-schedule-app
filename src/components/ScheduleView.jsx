import './ScheduleView.css';
import { formatCountdown, formatDate, getLessonTime } from '../lib/schedule.js';

/**
 * Экран расписания на неделю: шапка с информацией об обновлении
 * и таблицы занятий по дням.
 *
 * @param {{
 *   days: Array,
 *   loading: boolean,
 *   error: string|null,
 *   lastUpdated: string|null,
 *   countdown: number,
 *   onEditTemplate: () => void,
 *   onLogout: () => void,
 * }} props
 */
export default function ScheduleView({
  days,
  loading,
  error,
  lastUpdated,
  countdown,
  onEditTemplate,
  onLogout,
}) {
  if (loading) {
    return (
      <div className="schedule-container">
        <p>Загрузка расписания...</p>
      </div>
    );
  }

  if (error && days.length === 0) {
    return (
      <div className="schedule-container">
        <p className="schedule-error">Не удалось загрузить данные: {error}</p>
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
          <button type="button" className="logout-button" onClick={onEditTemplate}>
            Редактировать шаблон
          </button>
          <button type="button" className="logout-button" onClick={onLogout}>
            Сменить ключ
          </button>
        </div>
      </div>

      <div className="schedReS">
        {days.map((day) => (
          <div key={day.date} className="day-container">
            {day.lessons.length === 0 ? (
              <table className="dayTable" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td className="tdCapt" colSpan={3}>
                      <div className="spanCapt">&nbsp;{day.day_name.toLowerCase()}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="tdPair_3 tdPair_3--empty" colSpan={3}>
                      <div className="no-lessons">Занятий нет</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="tdPair_4" colSpan={3}>
                      {formatDate(day.date)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="dayTable" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td className="tdCapt" colSpan={3}>
                      <div className="spanCapt">&nbsp;{day.day_name.toLowerCase()}</div>
                    </td>
                  </tr>

                  {day.lessons.map((lesson) => (
                    <tr key={lesson.lesson_number}>
                      <td className="tdPair_1">{lesson.lesson_number}</td>
                      <td className="tdPair_2">{getLessonTime(lesson.lesson_number)}</td>
                      <td className="tdPair_3">
                        {lesson.subject}
                        <br />
                        <span className="prepod">{lesson.teacher}</span>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="tdPair_4" colSpan={3}>
                      {formatDate(day.date)}
                    </td>
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