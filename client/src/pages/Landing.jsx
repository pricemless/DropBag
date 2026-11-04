import { Link } from 'react-router-dom'

const features = [
  ['Aid Station Plan', 'Every crew access point, mile marker and cutoff in one timeline, sorted automatically.'],
  ['Drop Bag Checklists', 'Pack each bag item by item and see at a glance what is still missing.'],
  ['One-Tap Crew Link', 'Send your crew a private link. No app, no account, and it works on any phone.'],
  ['Pacer Finder', 'Find an experienced pacer for your race, or offer to pace someone else.'],
]

export default function Landing() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-kicker">Built for ultrarunners and their crews</div>
        <h1 className="hero-title">Your race plan.<br /><span>In every crew pocket.</span></h1>
        <p className="hero-sub">
          Plan aid stations, pack drop bags and share one live link with your crew,
          so nobody is guessing at mile 62 at 2am.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn">Start Free</Link>
          <Link to="/pacers" className="btn btn-ghost">Browse Pacers</Link>
        </div>
      </section>

      <section className="feature-grid">
        {features.map(([title, body]) => (
          <div key={title} className="feature">
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <section className="pricing">
        <div className="page-header"><h2>Pricing</h2><p>Start free. Upgrade when your season fills up.</p></div>
        <div className="pricing-grid">
          <div className="price-card">
            <h3>Free</h3>
            <div className="price">$0</div>
            <ul>
              <li>2 races</li><li>Unlimited aid stations</li><li>Drop bag checklists</li><li>Crew share links</li>
            </ul>
            <Link to="/signup" className="btn btn-ghost">Start Free</Link>
          </div>
          <div className="price-card featured">
            <h3>Pro</h3>
            <div className="price">$5<span>/mo</span></div>
            <ul>
              <li>Unlimited races</li><li>Everything in Free</li><li>Priority support</li>
            </ul>
            <span className="price-note">Coming soon</span>
          </div>
        </div>
      </section>
    </div>
  )
}
