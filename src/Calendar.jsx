import React, { useEffect, useState } from 'react';
import Arrow from './Arrow';

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const houstonDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
});
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function todayInHouston() {
  const { year, month, day } = Object.fromEntries(houstonDate.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${year.padStart(4, '0')}-${month}-${day}`;
}

function monthStart(year, month) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 1);
  return date;
}

function Month({ month, today }) {
  const [result, setResult] = useState({ events: [], status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const key = month.toISOString().slice(0, 7);

  useEffect(() => {
    let request;
    async function refresh() {
      if (document.hidden || request) return;
      request = new AbortController();
      const { signal } = request;
      try {
        const response = await fetch(`/api/calendar?month=${key}`, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) throw new Error('Calendar unavailable');
        const { events } = await response.json();
        if (!signal.aborted) setResult({ events, status: 'ready' });
      } catch {
        if (!signal.aborted) setResult(previous => ({ ...previous, status: 'error' }));
      } finally {
        request = null;
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      request?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [key, attempt]);

  const year = month.getUTCFullYear();
  const offset = month.getUTCDay();
  const days = new Date(monthStart(year, month.getUTCMonth() + 1) - 86400000).getUTCDate();
  const byDate = new Map();
  for (const event of result.events) {
    if (!byDate.has(event.date)) byDate.set(event.date, []);
    byDate.get(event.date).push(event);
  }
  const weeks = Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) =>
    weekdays.map((_, weekday) => week * 7 + weekday - offset + 1));

  return <>
    <table className="month-grid" aria-labelledby="month-label">
      <thead><tr>{weekdays.map(day => <th key={day} scope="col" aria-label={day}>{day.slice(0, 3)}</th>)}</tr></thead>
      <tbody>{weeks.map(week => <tr key={week[0]}>{week.map(day => {
        if (day < 1 || day > days) return <td className="day-outside" key={day} />;
        const iso = `${key}-${String(day).padStart(2, '0')}`;
        const events = byDate.get(iso) ?? [];
        return <td key={day} className={events.length ? 'day-has-events' : undefined}>
          <time dateTime={iso} aria-current={iso === today ? 'date' : undefined}>{day}</time>
          {events.length > 0 && <a className="day-event-link" href={`#events-${iso}`}
            aria-label={`${events.length} ${events.length === 1 ? 'event' : 'events'} on ${dateFormat.format(new Date(iso))}`}>
            <span className="day-event-dot" />
            <span className="day-event-title">{events[0].title}{events.length > 1 && ` +${events.length - 1}`}</span>
          </a>}
        </td>;
      })}</tr>)}</tbody>
    </table>
    <div className="calendar-agenda">
      <h3>This month’s events</h3>
      <div role="status">
        {result.status === 'loading' && <p>Loading events…</p>}
        {result.status === 'ready' && !result.events.length && <p>There are no events on the calendar for this month yet. Check back for new dates.</p>}
        {result.status === 'error' && <p>We couldn’t refresh the calendar. <button className="text-link" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
      </div>
      {[...byDate].map(([date, events]) => <section className="agenda-day" id={`events-${date}`} key={date} tabIndex={-1}>
        <time dateTime={date}>{dateFormat.format(new Date(date))}</time>
        <div>{events.map(event => <article key={event.id}>
          <h4>{event.title}</h4>
          {(event.time || event.location) && <p className="agenda-meta">{[event.time, event.location].filter(Boolean).join(' · ')}</p>}
          {event.description && <p>{event.description}</p>}
          {event.url && <a className="text-link" href={event.url}>Event details <Arrow /></a>}
        </article>)}</div>
      </section>)}
    </div>
  </>;
}

export default function Calendar() {
  const today = todayInHouston();
  const [month, setMonth] = useState(() => new Date(`${today.slice(0, 7)}-01T00:00:00Z`));
  function shiftMonth(amount) {
    setMonth(previous => monthStart(previous.getUTCFullYear(), previous.getUTCMonth() + amount));
  }
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  return <section className="calendar-page section-pad" aria-labelledby="calendar-title">
    <div className="calendar-intro">
      <p className="eyebrow"><span />The ABT calendar · Houston, Texas</p>
      <h1 id="calendar-title">See you <em>around.</em></h1>
      <p>Find our next soirée, service day or wellness gathering. All dates and times are local to Houston.</p>
    </div>
    <div className="calendar-shell">
      <div className="calendar-toolbar">
        <button className="month-arrow" aria-label="Previous month" disabled={year === 1 && index === 0} onClick={() => shiftMonth(-1)}><Arrow direction="left" /></button>
        <h2 id="month-label" aria-live="polite">{monthFormat.format(month)}</h2>
        <button className="month-arrow" aria-label="Next month" disabled={year === 9999 && index === 11} onClick={() => shiftMonth(1)}><Arrow direction="right" /></button>
      </div>
      <Month key={month.toISOString()} month={month} today={today} />
    </div>
    <a className="text-link calendar-back" href="/#socials"><Arrow direction="left" /> See past socials</a>
  </section>;
}
