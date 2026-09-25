import { useEffect, useState } from 'react';
import './TemplateEditor.css';
import { apiGet, apiPost, isAuthError } from '../lib/api.js';
import { DAYS, buildTemplatePayload, nextRowKey, normalizeTemplate } from '../utils/template.js';

/**
 * Экран редактирования базового недельного шаблона расписания.
 *
 * Загружает шаблон через GET /schedule/template, позволяет править
 * предметы/кабинеты/преподавателей по дням недели и сохраняет
 * изменения через POST /schedule/template (полная перезапись).
 *
 * @param {{
 *   apiKey: string,
 *   onBack: () => void,
 *   onAuthFailure: () => void,
 * }} props
 */
export default function TemplateEditor({ apiKey, onBack, onAuthFailure }) {
  // days: { 1: [{key, lesson_number, subject, classroom, teacher}], ..., 7: [...] }
  const [days, setDays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // {type: 'ok'|'error', text}

  // Загрузка текущего шаблона
  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const items = await apiGet('/schedule/template', apiKey);
        const byDay = normalizeTemplate(items);

        if (!cancelled) setDays(byDay);
      } catch (err) {
        if (isAuthError(err.status)) {
          onAuthFailure();
          return;
        }
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTemplate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Обновление одного поля одной строки
  const updateRow = (dayNumber, key, field, value) => {
    setDays((prev) => ({
      ...prev,
      [dayNumber]: prev[dayNumber].map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    }));
  };

  // Добавление пустой строки урока в конец дня
  const addRow = (dayNumber) => {
    setDays((prev) => {
      const list = prev[dayNumber];
      const maxNumber = list.reduce((max, row) => Math.max(max, row.lesson_number || 0), 0);
      return {
        ...prev,
        [dayNumber]: [
          ...list,
          {
            key: nextRowKey(),
            lesson_number: maxNumber + 1,
            subject: '',
            classroom: '',
            teacher: '',
          },
        ],
      };
    });
  };

  // Удаление строки урока
  const removeRow = (dayNumber, key) => {
    setDays((prev) => ({
      ...prev,
      [dayNumber]: prev[dayNumber].filter((row) => row.key !== key),
    }));
  };

  // Сборка payload и отправка POST /schedule/template
  const handleSave = async () => {
    const { payload, hasDuplicate } = buildTemplatePayload(days);

    if (hasDuplicate) {
      setSaveStatus({ type: 'error', text: 'В одном дне не может быть уроков с одинаковым номером.' });
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    try {
      await apiPost('/schedule/template', apiKey, payload);
      setSaveStatus({ type: 'ok', text: 'Шаблон сохранён.' });
    } catch (err) {
      if (isAuthError(err.status)) {
        onAuthFailure();
        return;
      }
      setSaveStatus({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="template-editor">
        <p>Загрузка шаблона...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="template-editor">
        <div className="template-editor-header">
          <button type="button" className="logout-button" onClick={onBack}>
            ← К расписанию
          </button>
        </div>
        <p className="template-error">Не удалось загрузить шаблон: {loadError}</p>
      </div>
    );
  }

  return (
    <div className="template-editor">
      <div className="template-editor-header">
        <div className="template-editor-title">
          <span className="template-editor-heading">Шаблон расписания на неделю</span>
          <span className="template-editor-hint">
            Изменения полностью перезапишут текущий шаблон
          </span>
        </div>
        <div className="template-editor-actions">
          <button type="button" className="logout-button" onClick={onBack}>
            ← К расписанию
          </button>
          <button
            type="button"
            className="template-save-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Сохранение…' : 'Сохранить шаблон'}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`template-save-status template-save-status--${saveStatus.type}`} role="status">
          {saveStatus.text}
        </div>
      )}

      <div className="template-grid">
        {DAYS.map((day) => {
          const rows = days[day.number];
          return (
            <div key={day.number} className="template-day">
              <div className="template-day-name">{day.name}</div>
              <table className="template-table" cellPadding="0" cellSpacing="0">
                <thead>
                  <tr>
                    <th className="template-th-num">№</th>
                    <th className="template-th-subject">Предмет</th>
                    <th className="template-th-classroom">Кабинет</th>
                    <th className="template-th-teacher">Преподаватель</th>
                    <th className="template-th-del" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td className="template-empty" colSpan="5">
                        Занятий нет
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td className="template-td-num">
                        <input
                          className="template-input template-input-num"
                          type="number"
                          min="1"
                          value={row.lesson_number}
                          onChange={(event) =>
                            updateRow(day.number, row.key, 'lesson_number', Number(event.target.value))
                          }
                        />
                      </td>
                      <td className="template-td-subject">
                        <input
                          className="template-input"
                          type="text"
                          value={row.subject}
                          placeholder="Предмет"
                          onChange={(event) =>
                            updateRow(day.number, row.key, 'subject', event.target.value)
                          }
                        />
                      </td>
                      <td className="template-td-classroom">
                        <input
                          className="template-input"
                          type="text"
                          value={row.classroom}
                          placeholder="—"
                          onChange={(event) =>
                            updateRow(day.number, row.key, 'classroom', event.target.value)
                          }
                        />
                      </td>
                      <td className="template-td-teacher">
                        <input
                          className="template-input"
                          type="text"
                          value={row.teacher}
                          placeholder="—"
                          onChange={(event) =>
                            updateRow(day.number, row.key, 'teacher', event.target.value)
                          }
                        />
                      </td>
                      <td className="template-td-del">
                        <button
                          type="button"
                          className="template-row-delete"
                          title="Удалить урок"
                          aria-label="Удалить урок"
                          onClick={() => removeRow(day.number, row.key)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="template-add-row" onClick={() => addRow(day.number)}>
                + Добавить урок
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}