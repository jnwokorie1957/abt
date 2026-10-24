import React, { useEffect, useRef, useState } from 'react';
import content from './content.json';
import Arrow from './Arrow';

const { site, faq, join, socials, pillars, story, steps, partners, testimonial, whyJoin } = content;
const Star = ({ className = '' }) => <svg aria-hidden="true" className={`star ${className}`} viewBox="0 0 100 100"><path d="M50 0 59 32 85 15 68 41 100 50 68 59 85 85 59 68 50 100 41 68 15 85 32 59 0 50 32 41 15 15 41 32Z" fill="currentColor" /></svg>;
const Eyebrow = ({ children, light = false }) => <p className={`eyebrow ${light ? 'light' : ''}`}><span />{children}</p>;
const Photo = ({ src, alt, priority = false, ...props }) => <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} {...props} />;

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function Header({ onJoin }) {
  const [open, setOpen] = useState(false);
  const menu = useRef(null);
  const toggle = useRef(null);
  useEffect(() => {
    if (!open) return;
    const key = event => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.key === 'Tab') {
        const items = menu.current.querySelectorAll('a,button');
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menu.current.querySelector('button').focus();
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', key); };
  }, [open]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a href="#top" className="brand" aria-label="A Better Tomorrow Social, home"><img src="/media/logo-navy.png" alt="" /><span>A BETTER<br />TOMORROW <small>SOCIAL</small></span></a>
      <nav aria-label="Main navigation" className="desktop-nav">{content.nav.slice(0, 4).map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
      <div className="header-actions"><button className="button small" onClick={onJoin}>Ask about joining <Arrow /></button><button ref={toggle} className="menu-toggle" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}><span /><span /></button></div>
    </header>
    <div id="mobile-menu" ref={menu} className={`mobile-menu ${open ? 'is-open' : ''}`} role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined} aria-label="Navigation" inert={!open ? true : undefined} aria-hidden={!open}>
      <button className="menu-close" onClick={() => { setOpen(false); toggle.current.focus(); }} aria-label="Close menu">×</button>
      <Eyebrow light>Explore ABT</Eyebrow>
      {content.nav.map((link, index) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{link.label}<Arrow /></a>)}
      <p className="serif">Here’s to a better tomorrow.</p>
    </div>
  </>;
}

function Hero({ onJoin }) {
  return <section id="top" className="hero">
    <div className="hero-heading"><div className="hero-topline"><Eyebrow>Houston, Texas · A social club for women</Eyebrow><span className="hero-note">Soirées, service<br /><i>and sisterhood.</i></span></div>
      <h1><span className="serif">a better</span><span className="tomorrow">TOMORROW<span className="wordmark-dot">✳</span></span></h1>
    </div>
    <div className="hero-lower">
      <div className="hero-copy"><span className="issue-number">SOIRÉES · SERVICE DAYS · WELLNESS</span><h2>A reason to gather.<br /><em>A way to give back.</em></h2><p>We’re a Houston social club for women. Join us for a dressed-up evening, a volunteer morning or a Pilates class, with a local cause at the heart of it.</p><button className="button" onClick={onJoin}>Ask about joining <Arrow /></button><a className="text-link" href="#socials">See past socials <Arrow direction="down" /></a></div>
      <div className="hero-collage" aria-label="A few moments from the club">
        <figure className="polaroid hero-photo photo-one"><Photo src="/media/service-1.webp" alt="ABT members volunteering at the Houston Food Bank" priority /><figcaption>show up. give back.</figcaption></figure>
        <figure className="polaroid hero-photo photo-two"><Photo src="/media/gal-backdrop.webp" alt="Two members celebrating at the Galentine’s Soirée" priority /><figcaption>better, together ♡</figcaption></figure>
        <span className="round-stamp">A LITTLE SOCIAL<br /><Star /><span>A LOT OF PURPOSE</span></span>
        <span className="handwritten hero-scribble">a morning at<br />the food bank <Arrow direction="down-left" /></span>
      </div>
    </div>
    <div className="hero-bottom"><span>HOUSTON WOMEN, GETTING TOGETHER.</span><span>TAKE A LOOK AROUND <Arrow direction="down" /></span></div>
  </section>;
}

function Story() {
  return <section id="story" className="story section-pad">
    <div className="section-intro" data-reveal><Eyebrow>01 / About ABT</Eyebrow><h2>We gather<br /><em>to give back.</em></h2><p>Good company, a shared plan and a cause close to home.</p></div>
    <div className="story-grid">
      <div className="story-photo" data-reveal><Photo src="/media/service-5.webp" alt="Members packing donations at the Houston Food Bank" /><span className="tape" /><span className="photo-caption">Saturday at Houston Food Bank.</span><span className="story-label"><Star /> SHOW UP. SERVE YOUR CITY.</span></div>
      <div className="story-copy" data-reveal><span className="handwritten">a reason to gather</span><h3>Cocktails, conversation<br /><em>and a cause.</em></h3><p className="lead">{story.lead}</p>{story.body.map(text => <p key={text}>{text}</p>)}<a className="text-link" href="#pillars">Meet our three pillars <Arrow /></a></div>
    </div>
    <div className="impact-strip" data-reveal><div><strong><small>Nearly</small>16,000</strong><span>meals packed at our service day</span></div><Star /><div><strong>3 pillars</strong><span>socials, service and wellness</span></div><Star /><div><strong>Our city.</strong><span>Houston, Texas.</span></div></div>
  </section>;
}

function EventCard({ event, index }) {
  const [slide, setSlide] = useState(0);
  const current = event.slides[slide];
  return <article className={`event-card event-${index}`} data-reveal>
    <div className="event-image">
      {current.video ? <video key={current.src} controls playsInline preload="none" poster={current.src} src={current.video} aria-label={current.alt} /> : <Photo key={current.src} src={current.src} alt={current.alt} />}
      <span className="event-category">{event.tags[0]}</span>
      <div className="gallery-controls"><button aria-label={`Previous photo of ${event.title}`} onClick={() => setSlide((slide + event.slides.length - 1) % event.slides.length)}><Arrow direction="left" /></button><span aria-live="polite">{String(slide + 1).padStart(2, '0')} / {String(event.slides.length).padStart(2, '0')}</span><button aria-label={`Next photo of ${event.title}`} onClick={() => setSlide((slide + 1) % event.slides.length)}><Arrow direction="right" /></button></div>
    </div>
    <div className="event-meta"><span>{event.date}</span><span>{event.place}</span></div><h3>{event.title}</h3><p>{event.blurb}</p><div className="cause"><span>♡</span>{event.cause}</div>
  </article>;
}

function Socials() {
  return <section id="socials" className="socials section-pad"><div className="section-heading" data-reveal><div><Eyebrow>02 / Past socials</Eyebrow><h2>A few days<br /><em>with ABT.</em></h2></div><div className="section-aside"><p>A look back at the soirées, service days and wellness mornings we’ve shared.</p><a className="text-link" href={site.instagram} target="_blank" rel="noreferrer">Find the next social <Arrow /></a></div></div><div className="event-grid">{socials.map((event, index) => <EventCard key={event.slug} event={event} index={index} />)}</div><p className="archive-note">These socials have already happened. Check Instagram for new dates and booking details.</p></section>;
}

function Pillars() {
  const [active, setActive] = useState(0);
  const descriptions = ['Bouquet making, cocktails and time to meet the women around you.', 'Volunteer mornings, donation drives and meal packing with Houston organizations.', 'Pilates, brunch and a little time to slow down.'];
  return <section id="pillars" className="pillars section-pad"><div className="section-heading" data-reveal><div><Eyebrow>03 / What we get up to</Eyebrow><h2>Serve. Connect.<br /><em>Inspire.</em></h2></div><p className="section-aside">Cocktail attire one day.<br />Volunteer shirts the next.</p></div><div className="pillar-layout" data-reveal><div className="pillar-tabs">{pillars.items.map((pillar, index) => <div key={pillar.name} className={`pillar-row ${active === index ? 'active' : ''}`}><button aria-expanded={active === index} aria-controls={`pillar-panel-${index}`} onClick={() => setActive(index)}><span className="number">0{index + 1}</span><span>{pillar.name}</span><Arrow className="pillar-arrow" /></button><div id={`pillar-panel-${index}`} className="pillar-description" inert={active !== index ? true : undefined} aria-hidden={active !== index}><div><p>{descriptions[index]}</p><div className="tags">{pillar.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div></div></div>)}</div><div className="pillar-photo">{pillars.items.map((pillar, index) => <Photo key={pillar.name} src={pillar.src} alt={index === active ? pillar.name : ''} aria-hidden={index !== active} className={active === index ? 'active' : ''} />)}<span className="pillar-photo-label">SOCIALS. SERVICE. WELLNESS.</span></div></div></section>;
}

function WhyJoin() {
  return <section className="belong section-pad"><div className="belong-heading" data-reveal><Eyebrow>A little about the club</Eyebrow><h2>Why women<br /><em>join ABT.</em></h2></div><div className="benefit-grid">{whyJoin.cards.map((card, index) => <article className={`benefit benefit-${index}`} key={card.title} data-reveal><span className="benefit-number">0{index + 1}</span><span className="benefit-icon" aria-hidden="true">{index === 3 ? <Arrow /> : ['♡', '✳', '✧'][index]}</span><h3>{card.title}</h3><p>{card.text}</p></article>)}</div><div className="testimonial" data-reveal><span className="quote-mark">“</span><blockquote>{testimonial.quote}<cite>{testimonial.by}</cite></blockquote><Photo src={testimonial.img} alt="A thank-you from Daya Houston for the Galentine’s fundraiser" /></div><p className="partner-label">ORGANIZATIONS, VENUES AND BUSINESSES WE’VE WORKED WITH</p><div className="partners">{partners.map(partner => <span key={partner}>{partner}</span>)}</div></section>;
}

function HowItWorks() {
  return <section className="how section-pad"><div data-reveal><Eyebrow>Planning to come along?</Eyebrow><h2>Before your<br /><em>first social.</em></h2></div><div className="steps">{steps.items.map((step, index) => <article key={step.n} data-reveal><span className="step-number">{step.n}</span><span className="step-connector" aria-hidden="true" /><h3>{step.name}</h3><p>{step.text}</p>{index === steps.items.length - 1 && <Star />}</article>)}</div></section>;
}

function FAQ({ onJoin }) {
  const [active, setActive] = useState(0);
  const labels = ['WHO IT’S FOR', 'TICKETS', 'THE CAUSES', 'MEMBERSHIP', 'PARTNERSHIPS', 'WHAT TO BRING'];
  return <section id="faq" className="faq section-pad"><div className="faq-intro" data-reveal><Eyebrow>04 / A few questions</Eyebrow><h2>Glad<br />you <em>asked.</em></h2><p>Tickets, membership and what to bring. Here’s what to know before you join us.</p><div className="faq-note"><Star /><span className="handwritten">Joining or<br />working together?</span><span className="note-rule" /><p>Tell us what brings<br />you to ABT.</p><button className="text-link" onClick={onJoin}>Send an inquiry <Arrow /></button></div></div><div className="faq-stack" data-reveal>{faq.items.map((item, index) => <article key={item.q} className={`faq-card faq-color-${index % 3} ${active === index ? 'expanded' : ''}`}><button onClick={() => setActive(active === index ? null : index)} aria-expanded={active === index} aria-controls={`faq-answer-${index}`} id={`faq-question-${index}`}><span className="faq-card-top"><span className="faq-number">0{index + 1}</span><span className="faq-topic">{labels[index]}</span><span className="faq-toggle">+</span></span><span className="faq-question">{item.q}</span></button><div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} className="faq-answer" inert={active !== index ? true : undefined} aria-hidden={active !== index}><div><p>{item.a}</p></div></div></article>)}</div></section>;
}

function Join({ onJoin }) {
  return <footer id="join" className="join section-pad"><div className="join-grid" data-reveal><div className="join-photos"><figure className="polaroid"><Photo src={join.photo} alt="Friends together at an ABT social" /><figcaption>an evening with ABT.</figcaption></figure><span className="join-sticker">HOUSTON, TX.<br /><em>See you around.</em><Star /></span></div><div className="join-copy"><Eyebrow>05 / Get in touch</Eyebrow><h2>Tell us a little<br /><em>about yourself.</em></h2><p>Tell us what brings you to ABT. Answer three quick questions about your interests, then leave your contact details.</p><button className="button" onClick={onJoin}>Start the questions <Arrow /></button><a className="text-link" href={site.instagram} target="_blank" rel="noreferrer">Or send us a DM <Arrow /></a></div></div><div className="footer-bottom"><a className="brand" href="#top">A BETTER TOMORROW SOCIAL <Arrow direction="up" /></a><span>© {new Date().getFullYear()} · Houston, Texas</span><span>Founded by {site.founders.map((founder, i) => <React.Fragment key={founder.handle}>{i > 0 && ' & '}<a href={founder.url} target="_blank" rel="noreferrer">{founder.handle}</a></React.Fragment>)}</span></div><div className="footer-word" aria-hidden="true">SEE YOU AROUND.</div></footer>;
}

function JoinDialog({ onClose }) {
  const dialog = useRef(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    const focus = document.activeElement;
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; focus?.focus(); };
  }, []);
  useEffect(() => { dialog.current.querySelector('[data-step-title]')?.focus(); }, [step, status]);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), email: form.get('email'), instagram: form.get('instagram'), answers: join.quiz.map((item, index) => ({ q: item.q, a: answers[index] })) }), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('save failed');
      setStatus('sent');
    } catch { setStatus('idle'); setError('We couldn’t save your inquiry. Please try again, or message us on Instagram.'); }
  }
  return <dialog className="join-dialog" ref={dialog} aria-labelledby="quiz-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}><div className="dialog-inner"><button className="dialog-close" onClick={onClose} aria-label="Close quiz">×</button><Eyebrow>Get in touch with ABT</Eyebrow>{status === 'sent' ? <div className="success"><Star /><h2 id="quiz-title" tabIndex={-1} data-step-title>Thanks for<br /><em>reaching out.</em></h2><p>Your inquiry has been saved for the ABT team. This doesn’t confirm membership or reserve a spot at an event.</p><button className="button" onClick={onClose}>Back to the site <Arrow /></button></div> : <><div className="quiz-progress" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map(n => <span key={n} className={step >= n ? 'complete' : ''} />)}</div>{step < 3 ? <><p className="quiz-step">QUESTION 0{step + 1} / 03</p><h2 id="quiz-title" key={step} tabIndex={-1} data-step-title>{join.quiz[step].q}</h2><div className="quiz-options">{join.quiz[step].options.map(option => <button key={option} onClick={() => { setAnswers([...answers.slice(0, step), option]); setStep(step + 1); }}>{option}<Arrow /></button>)}</div>{step > 0 && <button className="text-link" onClick={() => setStep(step - 1)}><Arrow direction="left" /> Back</button>}</> : <form onSubmit={submit}><h2 id="quiz-title" tabIndex={-1} data-step-title>Where can we<br /><em>reach you?</em></h2>{[{ name: 'name', label: 'First name', type: 'text', max: 120, auto: 'given-name' }, { name: 'email', label: 'Email', type: 'email', max: 254, auto: 'email' }, { name: 'instagram', label: 'Instagram (optional)', type: 'text', max: 100, auto: 'off' }].map(field => <label key={field.name}>{field.label}<input name={field.name} type={field.type} maxLength={field.max} autoComplete={field.auto} required={field.name !== 'instagram'} disabled={status === 'sending'} /></label>)}<p className="privacy-note">Your details stay private and are used to respond to your inquiry.</p>{error && <p className="form-error" role="alert">{error} <a href={site.instagram} target="_blank" rel="noreferrer">Contact ABT <Arrow /></a></p>}<button className="button" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send inquiry'}<Arrow /></button><button className="text-link" type="button" disabled={status === 'sending'} onClick={() => setStep(2)}><Arrow direction="left" /> Back</button></form>}</>}</div></dialog>;
}

export default function App() {
  const [joining, setJoining] = useState(false);
  useReveal();
  return <><Header onJoin={() => setJoining(true)} /><main id="main"><Hero onJoin={() => setJoining(true)} /><Story /><Socials /><Pillars /><WhyJoin /><HowItWorks /><FAQ onJoin={() => setJoining(true)} /></main><Join onJoin={() => setJoining(true)} />{joining && <JoinDialog onClose={() => setJoining(false)} />}</>;
}
