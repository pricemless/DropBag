import { Link } from 'react-router-dom'
import Icon from '../icons'

const features = [
  ['pin', 'Every aid station, in order', 'Miles, cutoffs and where to park, laid out as a simple timeline.'],
  ['bag', 'Drop bags, checked off', 'Never forget the headlamp at mile 50 again.'],
  ['share', 'One link for your crew', 'Text it. They open it. No app, no account.'],
  ['users', 'Find a pacer', 'Match with someone who knows the course.'],
]

const steps = [
  ['Add your race', 'Name, distance and date. Takes 30 seconds.'],
  ['Map your stations', 'Add aid stations, cutoffs, crew notes and what goes in each bag.'],
  ['Send the link', 'Your crew gets the whole plan on their phone.'],
]

export function Topo() {
  return (
    <svg className="topo" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M-20 ${40 + i * 30} C 80 ${10 + i * 30}, 160 ${80 + i * 28}, 240 ${40 + i * 30} S 380 ${10 + i * 32}, 430 ${50 + i * 30}`} />
      ))}
    </svg>
  )
}

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <Topo />
        <div className="hero-inner">
          <div className="hero-kicker">For ultrarunners and the crews who get them there</div>
          <h1>Your crew knows exactly where to be.</h1>
          <p>Plan aid stations, pack every drop bag, and share one simple link with your crew. No app download needed.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-accent btn-lg">Plan my race. It's free</Link>
            <Link to="/pacers" className="btn btn-on-hero btn-lg">Browse pacers</Link>
          </div>
        </div>
      </section>

      <div className="page">
        <section className="features">
          {features.map(([icon, title, body]) => (
            <div key={title} className="card feature">
              <div className="feature-icon"><Icon name={icon} size={22} /></div>
              <div><b>{title}</b><p>{body}</p></div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="section-title center">How it works</h2>
          <ol className="steps">
            {steps.map(([title, body], i) => (
              <li key={title}><span className="step-num">{i + 1}</span><div><b>{title}</b><p>{body}</p></div></li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="section-title center">Simple pricing</h2>
          <div className="pricing">
            <div className="card price-card">
              <b>Free</b>
              <div className="price">$0</div>
              <ul><li>2 races</li><li>Unlimited aid stations</li><li>Drop bag checklists</li><li>Crew share links</li></ul>
              <Link to="/signup" className="btn btn-ghost btn-block">Start free</Link>
            </div>
            <div className="card price-card featured">
              <b>Pro</b>
              <div className="price">$5<span>/mo</span></div>
              <ul><li>Unlimited races</li><li>Everything in Free</li><li>Priority support</li></ul>
              <span className="chip">Coming soon</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
