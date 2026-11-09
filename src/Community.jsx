import React, { useState } from 'react';
import Arrow from './Arrow';

const contactFields = (optional = false) => [
  { name: 'name', label: optional ? 'Your name (optional)' : 'Your name', max: 120, auto: 'name', optional },
  { name: 'email', label: optional ? 'Email (optional)' : 'Email', max: 254, auto: 'email', type: 'email', optional },
];

const forms = {
  sponsor: {
    heading: 'Sponsor an event',
    intro: 'Help bring an ABT gathering to life through sponsorship, products or other in-kind support.',
    fields: [
      ...contactFields(),
      { name: 'organization', label: 'Business or organization', max: 160, auto: 'organization' },
      { name: 'details', label: 'How would you like to sponsor?', max: 1000, multiline: true },
    ],
    button: 'Send sponsor inquiry',
    success: 'Thanks for reaching out about sponsorship. Your inquiry has been saved for the ABT team.',
  },
  venue: {
    heading: 'Host an event',
    intro: 'Have a Houston space in mind for a soirée, service day or wellness gathering? Tell us about it.',
    fields: [
      ...contactFields(),
      { name: 'organization', label: 'Venue or business', max: 160, auto: 'organization' },
      { name: 'location', label: 'Venue address or neighborhood', max: 200 },
      { name: 'capacity', label: 'Guest capacity (optional)', max: 60, optional: true },
      { name: 'details', label: 'Tell us about your space and what you’d like to host', max: 1000, multiline: true },
    ],
    button: 'Send venue inquiry',
    success: 'Thanks for sharing your space with us. Your inquiry has been saved for the ABT team.',
  },
  cause: {
    fields: [
      { name: 'organization', label: 'Cause or organization', max: 160 },
      { name: 'details', label: 'Why should ABT support this cause?', max: 1000, multiline: true },
      ...contactFields(true),
    ],
    button: 'Send a suggestion',
    success: 'Thanks for sharing a cause with us. Your suggestion has been saved for the ABT team.',
  },
};

function InquiryForm({ kind }) {
  const { fields, button, success } = forms[kind];
  const [status, setStatus] = useState('idle');

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setStatus('sending');
    try {
      const response = await fetch(`/api/inquiries/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error('Could not save submission');
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return <form className="community-form" onSubmit={submit} aria-labelledby={`${kind}-title`}>
    <fieldset disabled={status === 'sending'}>
      {fields.map(({ name, label, max, auto, type = 'text', optional, multiline }) =>
        <label key={name}>
          {label}
          {multiline
            ? <textarea name={name} rows={3} maxLength={max} required={!optional} />
            : <input name={name} type={type} autoComplete={auto} maxLength={max} required={!optional} />}
        </label>)}
    </fieldset>
    <p className="privacy-note">Your submission goes to the ABT team.</p>
    <button className="button" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : button}<Arrow /></button>
    <div role="status">{status === 'sent' && <p className="community-confirmation">{success}</p>}</div>
    {status === 'error' && <p className="form-error" role="alert">We couldn’t save your submission. Please try again.</p>}
  </form>;
}

export function Causes() {
  return <section id="causes" className="community-causes section-pad">
    <div className="community-wrap cause-layout">
      <div className="cause-intro">
        <p className="eyebrow"><span />The ABT suggestion box</p>
        <h2 id="cause-title">Causes to <em>support.</em></h2>
        <p>Know a Houston nonprofit or community cause we should get behind? Tell us who’s doing good work and how we might help.</p>
        <span className="handwritten">a little good goes a long way.</span>
      </div>
      <div className="community-card cause-card"><InquiryForm kind="cause" /></div>
    </div>
  </section>;
}

export function Partnerships() {
  return <section id="partner" className="community-partners section-pad">
    <div className="community-wrap">
      <div className="section-intro">
        <p className="eyebrow"><span />Local partnerships</p>
        <h2>Partner <em>with ABT.</em></h2>
        <p>Let’s bring Houston women together for a good cause.</p>
      </div>
      <div className="partnership-grid">
        {['sponsor', 'venue'].map((kind, index) => <article id={kind} className="community-card" key={kind}>
          <p className="eyebrow"><span />0{index + 1} / {kind === 'sponsor' ? 'Sponsorship' : 'Venue intake'}</p>
          <h3 id={`${kind}-title`}>{forms[kind].heading}</h3>
          <p>{forms[kind].intro}</p>
          <InquiryForm kind={kind} />
        </article>)}
      </div>
    </div>
  </section>;
}
