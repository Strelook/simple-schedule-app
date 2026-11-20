import { useState } from 'react';
import { getApiKey, saveApiKey, clearApiKey } from './lib/auth.js';
import useSchedule from './hooks/useSchedule.js';
import LoginScreen from './components/LoginScreen.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import TemplateEditor from './components/TemplateEditor.jsx';

/**
 * Корневой компонент: управляет авторизацией и переключением
 * между экранами (вход, расписание, редактор шаблона).
 */
function App() {
  // X-API-Key из localStorage (с учётом срока действия 30 дней)
  const [apiKey, setApiKeyState] = useState(() => getApiKey());

  // Текущий экран: 'schedule' — расписание, 'template' — редактор шаблона
  const [view, setView] = useState('schedule');

  const isAuthed = Boolean(apiKey);

  // Успешный вход: сохраняем ключ на 30 дней и показываем расписание
  const handleLogin = (key) => {
    saveApiKey(key);
    setApiKeyState(key);
    setView('schedule');
  };

  // Выход по кнопке пользователя или сброс авторизации (401/403, истёкший ключ)
  const handleLogout = () => {
    clearApiKey();
    setApiKeyState(null);
    setView('schedule');
  };

  const { scheduleData, loading, error, lastUpdated, countdown } = useSchedule(apiKey, {
    onAuthFailure: handleLogout,
  });

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
        onAuthFailure={handleLogout}
      />
    );
  }

  return (
    <ScheduleView
      days={scheduleData}
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      countdown={countdown}
      onEditTemplate={() => setView('template')}
      onLogout={handleLogout}
    />
  );
}

export default App;
