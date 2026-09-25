// Константы и вспомогательные функции отображения расписания.

// Примерное время занятий по номеру урока.
// Урок длится 45 минут, перемена 15 минут, после 3-го урока большая перемена 20 минут.
// Пока используется шаблонный вариант до появления реальных данных о времени.
export const LESSON_TIMES = {
  1: '08:30 – 09:15',
  2: '09:30 – 10:15',
  3: '10:30 – 11:15',
  4: '11:35 – 12:20',
  5: '12:35 – 13:20',
  6: '13:35 – 14:20',
  7: '14:35 – 15:20',
  8: '15:35 – 16:20',
  9: '16:35 – 17:20',
  10: '17:35 – 18:20',
};

/**
 * Возвращает время урока по его номеру (пустая строка, если номер не определён).
 * @param {number} lessonNumber
 * @returns {string}
 */
export const getLessonTime = (lessonNumber) => LESSON_TIMES[lessonNumber] ?? '';

/**
 * Форматирует секунды в вид ММ:СС (например, 299 -> "04:59").
 * @param {number} seconds
 * @returns {string}
 */
export function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Форматирует дату из ISO в русскую локаль (например, 2026-09-25 -> 25.09.2026).
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}