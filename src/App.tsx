import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import './style.css';

type Device = {
  id: string;
  name: string;
  kategorie: string;
  standort: string;
  beschreibung: string;
};
const categories = ['Alle', 'Notebook', 'Beamer', 'Audio', 'Kamera'];
const storageKey = 'geraeteausleihe.merkliste';

function readWatchlist(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeWatchlist(ids: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable in a private browser session.
  }
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return <button type="button" aria-pressed={dark} onClick={toggle}>{dark ? 'Hell' : 'Dunkel'}</button>;
}

function CategoryFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="categories" role="group" aria-label="Kategorie">
    {categories.map(category => <button key={category} type="button" className="category"
      aria-pressed={category === value} onClick={() => onChange(category)}>{category}</button>)}
  </div>;
}

function DeviceList({ devices, saved, open, toggle }: {
  devices: Device[]; saved: string[]; open: (device: Device) => void; toggle: (id: string) => void;
}) {
  return <div id="device-list" aria-label="Trefferliste">
    {devices.length === 0 ? <p>Keine Geräte gefunden.</p> : <ul className="devices">
      {devices.map(device => <li key={device.id}>
        <button id={`device-${device.id}`} aria-label={device.name} className="device-name" type="button" onClick={() => open(device)}>
          <span>{device.name}</span><small>{device.kategorie} · {device.standort}</small>
        </button>
        <button type="button" className="star" aria-label={`${device.name} merken`}
          aria-pressed={saved.includes(device.id)} onClick={() => toggle(device.id)}>
          <span aria-hidden="true">{saved.includes(device.id) ? '★' : '☆'}</span>
          <span>{saved.includes(device.id) ? 'Gemerkt' : 'Merken'}</span>
        </button>
      </li>)}
    </ul>}
  </div>;
}

function LoanForm({ device }: { device: Device }) {
  const [values, setValues] = useState({ name: '', group: '', date: '' });
  const [errors, setErrors] = useState<Partial<typeof values>>({});
  const [success, setSuccess] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Partial<typeof values> = {};
    if (!values.name.trim()) next.name = 'Bitte gib deinen Namen ein.';
    if (!values.group.trim()) next.group = 'Bitte gib deine Klasse ein.';
    if (!values.date) next.date = 'Bitte wähle ein Rückgabedatum.';
    else if (values.date < today()) next.date = 'Das Rückgabedatum darf nicht in der Vergangenheit liegen.';
    setErrors(next);
    setSuccess('');
    const first = next.name ? nameRef : next.group ? groupRef : next.date ? dateRef : null;
    if (first) {
      first.current?.focus();
      return;
    }
    const formatted = values.date.split('-').reverse().join('.');
    setSuccess(`Ausgeliehen: ${device.name} an ${values.name.trim()} (${values.group.trim()}) bis ${formatted}.`);
    setValues({ name: '', group: '', date: '' });
  }

  return <form id="loan-form" noValidate onSubmit={submit}>
    <h3>Gerät ausleihen</h3>
    {([
      ['name', 'Name', 'text', nameRef],
      ['group', 'Klasse', 'text', groupRef],
      ['date', 'Rückgabedatum', 'date', dateRef],
    ] as const).map(([field, label, type, ref]) => <div className="field" key={field}>
      <label htmlFor={`loan-${field}`}>{label}</label>
      <input id={`loan-${field}`} ref={ref} type={type} value={values[field]}
        aria-invalid={errors[field] ? 'true' : undefined}
        aria-describedby={errors[field] ? `error-${field}` : undefined}
        onChange={event => setValues({ ...values, [field]: event.target.value })} />
      {errors[field] && <p id={`error-${field}`} className="field-error">{errors[field]}</p>}
    </div>)}
    <button type="submit" className="primary">Ausleihen</button>
    {success && <p className="success" role="status">{success}</p>}
  </form>;
}

function DeviceDetail({ device, close }: { device: Device | null; close: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (device) heading.current?.focus(); }, [device]);
  return <section id="device-detail" className="panel detail" aria-labelledby={device ? 'detail-title' : undefined}
    aria-label={device ? undefined : 'Detailansicht'}>
    {device ? <>
      <div className="eyebrow">Gerätedetails</div>
      <h2 id="detail-title" ref={heading} tabIndex={-1}>{device.name}</h2>
      <dl><dt>Kategorie</dt><dd>{device.kategorie}</dd><dt>Standort</dt><dd>{device.standort}</dd></dl>
      <p>{device.beschreibung}</p>
      <button type="button" onClick={close}>Schließen</button>
      <LoanForm key={device.id} device={device} />
    </> : <p>Wähle links ein Gerät aus.</p>}
  </section>;
}

function Watchlist({ devices, saved, clear }: { devices: Device[]; saved: string[]; clear: () => void }) {
  return <section className="panel watchlist" aria-labelledby="watchlist-title">
    <h2 id="watchlist-title">Gemerkte Geräte</h2>
    {saved.length ? <ul>{saved.map(id => <li key={id}>{devices.find(device => device.id === id)?.name ?? id}</li>)}</ul>
      : <p>Deine Merkliste ist leer.</p>}
    <button type="button" onClick={clear}>Merkliste leeren</button>
  </section>;
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle');
  const [selected, setSelected] = useState<Device | null>(null);
  const [saved, setSaved] = useState(readWatchlist);
  const [dark, setDark] = useState(false);
  const [returnFocus, setReturnFocus] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const returnId = useRef<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('./geraete.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Request failed');
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(item => item &&
        ['id', 'name', 'kategorie', 'standort', 'beschreibung'].every(field => typeof item[field] === 'string'))) {
        throw new Error('Invalid data');
      }
      setDevices(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function close() {
    setSelected(null);
    const button = returnId.current ? document.getElementById(`device-${returnId.current}`) : null;
    if (!button) {
      setQuery('');
      setCategory('Alle');
    }
    setReturnFocus(returnId.current);
  }

  useEffect(() => {
    if (!returnFocus) return;
    document.getElementById(`device-${returnFocus}`)?.focus();
    setReturnFocus(null);
  }, [returnFocus]);

  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (query) {
        setQuery('');
        setSelected(null);
        searchRef.current?.focus();
      } else if (selected) close();
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [query, selected]);

  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    setSaved(next);
    writeWatchlist(next);
  }

  function clearSaved() {
    setSaved([]);
  }

  const filtered = devices.filter(device =>
    (category === 'Alle' || device.kategorie === category) &&
    `${device.name} ${device.beschreibung}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')));

  return <div className={`app ${dark ? 'dark' : 'light'}`}>
    <div className="shell">
      <header>
        <div><p className="eyebrow">IT-Raum · Ausstattung</p><h1>Geräteausleihe IT-Raum</h1></div>
        <div className="header-tools"><ThemeToggle dark={dark} toggle={() => setDark(!dark)} />
          <span id="watchlist-count" className="counter">Merkliste ({saved.length})</span></div>
      </header>
      <main className="columns">
        <section className="panel catalog" aria-labelledby="catalog-title">
          <h2 id="catalog-title">Geräte finden</h2>
          <div className="field"><label htmlFor="search">Suche</label>
            <input id="search" ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} />
          </div>
          <CategoryFilter value={category} onChange={setCategory} />
          <div className="actions"><button type="button" onClick={() => { setQuery(''); setCategory('Alle'); }}>Filter zurücksetzen</button>
            <button type="button" onClick={() => void load()}>Aktualisieren</button></div>
          {loading && <p>Geräte werden geladen …</p>}
          {error && <div className="load-error"><p role="alert">Die Geräteliste konnte nicht geladen werden.</p>
            <button type="button" onClick={() => void load()}>Erneut versuchen</button></div>}
          <p className="result-count">{filtered.length} Geräte</p>
          <DeviceList devices={filtered} saved={saved} open={device => { returnId.current = device.id; setSelected({ ...device }); }} toggle={toggleSaved} />
        </section>
        <DeviceDetail device={selected} close={close} />
      </main>
      <Watchlist devices={devices} saved={saved} clear={clearSaved} />
    </div>
  </div>;
}
