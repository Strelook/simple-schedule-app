// Чистые функции и константы для редактора недельного шаблона (без React).

// Дни недели: 1 - Понедельник ... 7 - Воскресенье
export const DAYS = [
  { number: 1, name: 'Понедельник' },
  { number: 2, name: 'Вторник' },
  { number: 3, name: 'Среда' },
  { number: 4, name: 'Четверг' },
  { number: 5, name: 'Пятница' },
  { number: 6, name: 'Суббота' },
  { number: 7, name: 'Воскресенье' },
];

// Счётчик локальных ключей строк (для React-списков)
let rowCounter = 0;
export const nextRowKey = () => `row-${++rowCounter}`;

/**
 * Преобразует ответ API GET /schedule/template в вид
 * { 1: [{key, lesson_number, subject, classroom, teacher}], ..., 7: [...] }.
 * Некорректные day_of_week игнорируются, строки сортируются по номеру урока.
 * @param {Array} items - элементы шаблона из API
 * @returns {Object} словарь дней
 */
export function normalizeTemplate(items) {
  const byDay = {};
  for (const day of DAYS) byDay[day.number] = [];

  for (const item of items) {
    const list = byDay[item.day_of_week];
    if (!list) continue; // игнорируем некорректные day_of_week
    list.push({
      key: nextRowKey(),
      lesson_number: item.lesson_number,
      subject: item.subject ?? '',
      classroom: item.classroom ?? '',
      teacher: item.teacher ?? '',
    });
  }

  for (const day of DAYS) {
    byDay[day.number].sort((a, b) => a.lesson_number - b.lesson_number);
  }

  return byDay;
}

/**
 * Собирает payload для POST /schedule/template из текущего состояния редактора.
 * Пустые строки пропускаются; при дублировании номера урока в одном дне
 * возвращается hasDuplicate = true.
 * @param {Object} days - состояние редактора { 1: [...], ..., 7: [...] }
 * @returns {{payload: Array, hasDuplicate: boolean}}
 */
export function buildTemplatePayload(days) {
  const payload = [];
  let hasDuplicate = false;

  for (const day of DAYS) {
    const rows = days[day.number];
    const seen = new Set();

    for (const row of rows) {
      const subject = row.subject.trim();
      if (!subject) continue; // пустые строки не отправляем

      if (seen.has(row.lesson_number)) {
        hasDuplicate = true;
        break;
      }
      seen.add(row.lesson_number);

      payload.push({
        day_of_week: day.number,
        lesson_number: row.lesson_number,
        subject,
        classroom: row.classroom.trim() || null,
        teacher: row.teacher.trim() || null,
      });
    }
    if (hasDuplicate) break;
  }

  return { payload, hasDuplicate };
}