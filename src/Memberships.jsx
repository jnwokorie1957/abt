import React from 'react';
import Arrow from './Arrow';
import plans from '../membership-plans.json';

export default function Memberships({ onJoin }) {
  return <section id="memberships" className="memberships section-pad" aria-labelledby="memberships-title">
    <div className="membership-intro" data-reveal>
      <p className="eyebrow"><span />Monthly memberships</p>
      <h2 id="memberships-title">A little more connected.<br /><em>A little more involved.</em></h2>
      <p>Two ways to belong, with a shared purpose: bringing people together and giving back to Houston.</p>
    </div>
    <div className="membership-grid" data-reveal>
      {plans.map(plan => <article key={plan.id} className={`membership-card membership-${plan.id}`} aria-labelledby={`${plan.id}-title`}>
        <p className="eyebrow"><span />{plan.tier}</p>
        <h3 id={`${plan.id}-title`}>{plan.name}</h3>
        <p className="membership-price"><span>${plan.monthlyPrice}</span><span>per month</span></p>
        <button className="button" onClick={() => onJoin(plan.id)}>Ask about {plan.tier} <Arrow /></button>
      </article>)}
    </div>
    <p className="membership-note">Full membership details will be announced soon. Online monthly payments are coming soon. For now, send an inquiry about your preferred tier. An inquiry does not start a membership or charge you.</p>
    <a className="text-link" href="#causes">Have a cause in mind? Visit the suggestion box <Arrow direction="down" /></a>
  </section>;
}
