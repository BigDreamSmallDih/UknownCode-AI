import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { fetchModels, pickModel, streamChat, type ChatTurn, type ModelOption } from '../lib/chat';
import { useNetwork } from '../lib/useNetwork';
import { Icon } from './Icon';

interface Bubble {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  errorKey?: MessageKey;
}

type ModelsState = 'idle' | 'loading' | 'ready' | 'error';

export function ChatPanel() {
  const { t } = useI18n();
  const { settings, update } = useSettings();
  const { session } = useAuth();
  const { online } = useNetwork();

  const token = session?.access_token;
  const baseUrl = settings.backendUrl;

  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsState, setModelsState] = useState<ModelsState>('idle');
  const [model, setModel] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const nextId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadModels = useCallback(async () => {
    if (!baseUrl || !token) return;
    const controller = new AbortController();
    setModelsState('loading');
    try {
      const list = await fetchModels(baseUrl, token, controller.signal);
      setModels(list);
      setModel((current) => pickModel(list, current || settings.aiModel));
      setModelsState('ready');
    } catch {
      setModelsState('error');
    }
  }, [baseUrl, token, settings.aiModel]);

  useEffect(() => {
    if (online) void loadModels();
    // Reload when the server or account changes, not on every settings change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token, online]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth' });
  }, [bubbles, settings.reduceMotion]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || streaming || !baseUrl || !token || !model) return;

    const userBubble: Bubble = { id: nextId.current++, role: 'user', content: text };
    const replyId = nextId.current++;
    const history: ChatTurn[] = [...bubbles, userBubble]
      .filter((bubble) => bubble.content !== '')
      .map((bubble) => ({ role: bubble.role, content: bubble.content }));

    setBubbles((current) => [...current, userBubble, { id: replyId, role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const outcome = await streamChat({
      baseUrl,
      token,
      model,
      messages: history,
      signal: controller.signal,
      onDelta: (delta) =>
        setBubbles((current) =>
          current.map((bubble) =>
            bubble.id === replyId ? { ...bubble, content: bubble.content + delta } : bubble,
          ),
        ),
    });

    if (!outcome.ok) {
      setBubbles((current) =>
        current.map((bubble) => (bubble.id === replyId ? { ...bubble, errorKey: outcome.key } : bubble)),
      );
    }
    abortRef.current = null;
    setStreaming(false);
  }

  function chooseModel(id: string) {
    setModel(id);
    void update({ aiModel: id });
  }

  function clearChat() {
    abortRef.current?.abort();
    setBubbles([]);
    setStreaming(false);
  }

  if (!baseUrl) {
    return (
      <section className="card">
        <h2>{t('chat.title')}</h2>
        <p className="muted">{t('chat.needBackend')}</p>
        <Link to="/settings">{t('home.openSettings')}</Link>
      </section>
    );
  }
  if (!token) {
    return (
      <section className="card">
        <h2>{t('chat.title')}</h2>
        <p className="muted">{t('chat.needLogin')}</p>
      </section>
    );
  }

  const free = models.filter((item) => item.free);
  const paid = models.filter((item) => !item.free);

  return (
    <section className="card chat">
      <div className="chat-head">
        <h2>{t('chat.title')}</h2>
        {bubbles.length > 0 && (
          <button type="button" className="icon-btn" onClick={clearChat} aria-label={t('chat.clear')}>
            <Icon name="trash" size={18} />
          </button>
        )}
      </div>

      <label htmlFor="chat-model" className="muted">
        {t('chat.model')}
      </label>
      {modelsState === 'loading' && <p className="muted">{t('chat.modelsLoading')}</p>}
      {modelsState === 'error' && (
        <div className="row">
          <p className="error-text">{t('chat.modelsFailed')}</p>
          <button type="button" className="btn" onClick={() => void loadModels()}>
            {t('chat.retryModels')}
          </button>
        </div>
      )}
      {modelsState === 'ready' && (
        <select
          id="chat-model"
          className="input"
          value={model}
          disabled={streaming}
          onChange={(event) => chooseModel(event.target.value)}
        >
          {free.length > 0 && (
            <optgroup label={t('chat.free')}>
              {free.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          )}
          {paid.length > 0 && (
            <optgroup label={t('chat.paid')}>
              {paid.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      )}

      <div className="messages" aria-live="polite">
        {bubbles.length === 0 && <p className="muted chat-empty">{t('chat.empty')}</p>}
        {bubbles.map((bubble) => (
          <div key={bubble.id} className={`bubble ${bubble.role}`}>
            <span className="bubble-who">
              {bubble.role === 'user' ? t('chat.you') : t('chat.assistant')}
            </span>
            {bubble.content === '' && !bubble.errorKey ? (
              <span className="typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            ) : (
              <span className="bubble-text">{bubble.content}</span>
            )}
            {bubble.errorKey && <span className="error-text">{t(bubble.errorKey)}</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={(event) => void send(event)}>
        <textarea
          className="input"
          rows={2}
          placeholder={t('chat.placeholder')}
          value={input}
          disabled={modelsState !== 'ready'}
          onChange={(event) => setInput(event.target.value)}
        />
        {streaming ? (
          <button
            type="button"
            className="btn danger send"
            onClick={() => abortRef.current?.abort()}
            aria-label={t('chat.stop')}
          >
            <Icon name="stop" size={20} />
          </button>
        ) : (
          <button
            type="submit"
            className="btn primary send"
            disabled={!input.trim() || !online || modelsState !== 'ready'}
            aria-label={t('chat.send')}
          >
            <Icon name="send" size={20} />
          </button>
        )}
      </form>
    </section>
  );
}
