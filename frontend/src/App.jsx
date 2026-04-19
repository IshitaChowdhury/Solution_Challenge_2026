import { useMemo, useState } from "react";
import { API_BASE_URL } from "./api";
import { cityOptions, loadingSteps, skillOptions } from "./options";

function App() {
  const [page, setPage] = useState("home");
  const [statusMessage, setStatusMessage] = useState("");

  function goToSection(sectionId) {
    setPage("home");
    setTimeout(() => {
      if (sectionId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  }

  const [volunteerForm, setVolunteerForm] = useState({
    name: "",
    skill: "Medical",
    location: "Kolkata",
    phone: "",
    email: ""
  });

  const [ngoForm, setNgoForm] = useState({
    text: "",
    requiredSkill: "Medical",
    location: "Kolkata"
  });

  const [demoForm, setDemoForm] = useState({
    text: "",
    requiredSkill: "General",
    location: "Kolkata"
  });

  const [demoResult, setDemoResult] = useState(null);
  const [assignResult, setAssignResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [isLoadingVolunteer, setIsLoadingVolunteer] = useState(false);
  const [isAnalyzingDemo, setIsAnalyzingDemo] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const currentNeedSummary = useMemo(() => {
    if (!assignResult) {
      return null;
    }

    return {
      text: assignResult.sourceText,
      location: assignResult.sourceLocation
    };
  }, [assignResult]);

  function onVolunteerChange(event) {
    const { name, value } = event.target;
    setVolunteerForm((current) => ({ ...current, [name]: value }));
  }

  function onNgoChange(event) {
    const { name, value } = event.target;
    setNgoForm((current) => ({ ...current, [name]: value }));
  }

  function onDemoChange(event) {
    const { name, value } = event.target;
    setDemoForm((current) => ({ ...current, [name]: value }));
  }

  async function submitVolunteer(event) {
    event.preventDefault();
    setStatusMessage("");
    setIsLoadingVolunteer(true);

    try {
      const response = await fetch(`${API_BASE_URL}/add-volunteer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(volunteerForm)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setVolunteerForm({
        name: "",
        skill: "Medical",
        location: "Kolkata",
        phone: "",
        email: ""
      });
      setStatusMessage("Volunteer registered successfully.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsLoadingVolunteer(false);
    }
  }

  async function runDemoAnalysis(event) {
    event.preventDefault();
    setStatusMessage("");
    setIsAnalyzingDemo(true);
    setDemoResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoForm)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Demo analysis failed");
      }

      setDemoResult({
        urgency: data.urgency,
        category: data.category,
        summary: data.summary
      });
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsAnalyzingDemo(false);
    }
  }

  async function analyzeAndAssign(event) {
    event.preventDefault();
    setStatusMessage("");
    setAssignResult(null);
    setIsAssigning(true);

    let currentStep = 0;
    setActiveStep(0);

    const ticker = setInterval(() => {
      currentStep = (currentStep + 1) % loadingSteps.length;
      setActiveStep(currentStep);
    }, 800);

    try {
      const response = await fetch(`${API_BASE_URL}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ngoForm)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Assign failed");
      }

      const fullResult = {
        ...data,
        volunteers: Array.isArray(data.volunteers) ? data.volunteers : data.volunteer ? [data.volunteer] : [],
        volunteer: data.volunteer || data.assignedVolunteer || null,
        sourceText: ngoForm.text,
        sourceLocation: ngoForm.location,
        sourceSkill: ngoForm.requiredSkill,
        createdAt: new Date().toLocaleString()
      };

      setAssignResult(fullResult);
      setHistory((current) => [fullResult, ...current].slice(0, 8));
      setPage("result");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      clearInterval(ticker);
      setIsAssigning(false);
      setActiveStep(0);
    }
  }

  return (
    <div className={`site-root ${page === "home" || page === "features" ? "has-navbar" : ""}`}>
      {page === "home" || page === "features" ? (
        <header className="navbar">
          <button className="logo" type="button" onClick={() => goToSection("home")}>Volnix AI</button>
          <nav className="nav-links">
            <button type="button" onClick={() => goToSection("home")}>Home</button>
            <button type="button" onClick={() => goToSection("features")}>Features</button>
            <button type="button" onClick={() => goToSection("how")}>How it Works</button>
          </nav>
        </header>
      ) : null}

      {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}

      {page === "home" ? (
        <main id="home" className="page home-page">
          <section className="hero-section hero-showcase">
            <div className="hero-copy hero-center-copy">
              <div className="hero-brand">Volnix AI</div>
              <h1>Grow your impact</h1>
              <p>
                Empower your NGO with intelligent volunteer coordination. Detect urgency, analyze needs, and assign the best fit—all in seconds.
              </p>
              <div className="hero-actions">
                <button className="primary-btn" type="button" onClick={() => setPage("ngo")}>
                  NGO Panel
                </button>
                <button className="primary-btn" type="button" onClick={() => setPage("volunteer")}>
                  Join as Volunteer
                </button>
              </div>
            </div>
          </section>

        </main>
      ) : null}

      {page === "features" || page === "home" ? (
        <main id="features" className="page features-page">
          <section className="features-hero">
            <h2>Volunteer coordination doesn't have to be difficult.
              <br />We're here to help.</h2>
            <p className="section-subtitle">Intelligent tools that take the complexity out of NGO operations.</p>
          </section>

          <section className="features-problems">
            <article className="problem-card">
              <div className="card-icon">01</div>
              <h3>Struggling with Manual Coordination?</h3>
              <p>At Volnix AI, coordinating volunteers is automated. We detect urgency, match skills intelligently, and get your team deployed fast alongside expert insights.</p>
            </article>
            <article className="problem-card">
              <div className="card-icon">02</div>
              <h3>Can't Find the Right Volunteer?</h3>
              <p>Every NGO is different. That's why we use AI-powered multi-skill scoring to find matched volunteers—tailored for your community and evolving needs.</p>
            </article>
            <article className="problem-card">
              <div className="card-icon">03</div>
              <h3>Losing Time to Communication?</h3>
              <p>We work with complete urgency analysis and instant contact options. Get real-time updates through intelligent matching and a dedicated coordination team.</p>
            </article>
          </section>

        </main>
      ) : null}

      {page === "how" || page === "home" ? (
        <main id="how" className="page features-page">
          <section className="features-hero">
            <h2>Intelligent workflow built for speed and impact.</h2>
            <p className="section-subtitle">From submission to assignment in three simple steps.</p>
          </section>

          <section className="features-problems">
            <article className="problem-card">
              <div className="step-number">1</div>
              <h3>Submit Your Need</h3>
              <p>NGOs enter a description of the community need, specify the required skills, and select their location. Our system captures all essential details in seconds.</p>
            </article>
            <article className="problem-card">
              <div className="step-number">2</div>
              <h3>AI-Powered Analysis</h3>
              <p>Gemini analyzes urgency levels, categorizes the need, and generates actionable insights. Real-time processing ensures no time is wasted.</p>
            </article>
            <article className="problem-card">
              <div className="step-number">3</div>
              <h3>Perfect Volunteer Match</h3>
              <p>Our system scores all available volunteers using multi-skill scoring and matches the strongest fit based on skills, location, and availability instantly.</p>
            </article>
          </section>

        </main>
      ) : null}

      {page === "volunteer" ? (
        <main className="page split-page">
          {/* Left branding panel */}
          <aside className="split-aside">
            <button className="back-pill" type="button" onClick={() => setPage("home")}>Back to Home</button>
            <div className="split-aside-body">
              <div className="split-icon">V</div>
              <h2>Join as a Volunteer</h2>
              <p>Make a real difference. Get matched with NGOs that need your skills.</p>
              <ul className="split-perks">
                <li>Instant skill matching</li>
                <li>Location-based deployment</li>
                <li>Urgent need alerts</li>
              </ul>
            </div>
          </aside>

          {/* Right form panel */}
          <section className="split-form-panel">
            <h3>Create Your Profile</h3>
            <form className="form-grid" onSubmit={submitVolunteer}>
              <label>
                Full Name
                <input name="name" value={volunteerForm.name} onChange={onVolunteerChange} placeholder="Your full name" required />
              </label>
              <label>
                Primary Skill
                <select name="skill" value={volunteerForm.skill} onChange={onVolunteerChange}>
                  {skillOptions.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </label>
              <label>
                Location
                <select name="location" value={volunteerForm.location} onChange={onVolunteerChange}>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input name="phone" value={volunteerForm.phone} onChange={onVolunteerChange} placeholder="+91 XXXXX XXXXX" required />
              </label>
              <label className="full-row">
                Email
                <input type="email" name="email" value={volunteerForm.email} onChange={onVolunteerChange} placeholder="you@example.com" required />
              </label>
              <button className="primary-btn split-submit-btn" type="submit" disabled={isLoadingVolunteer}>
                {isLoadingVolunteer ? "Registering..." : "Register as Volunteer"}
              </button>
            </form>
          </section>
        </main>
      ) : null}

      {page === "ngo" ? (
        <main className="page split-page">
          {/* Left branding panel */}
          <aside className="split-aside split-aside--ngo">
            <button className="back-pill" type="button" onClick={() => setPage("home")}>Back to Home</button>
            <div className="split-aside-body">
              <div className="split-icon">N</div>
              <h2>NGO Dashboard</h2>
              <p>Submit a need and our AI will detect urgency and assign the best-fit volunteer instantly.</p>
              <ul className="split-perks">
                <li>Gemini AI urgency analysis</li>
                <li>Skill-based volunteer matching</li>
                <li>Actionable insights, instantly</li>
              </ul>
            </div>
          </aside>

          {/* Right form panel */}
          <section className="split-form-panel">
            <h3>Submit a Community Need</h3>
            <form className="form-grid" onSubmit={analyzeAndAssign}>
              <label className="full-row">
                Need Description
                <textarea
                  name="text"
                  value={ngoForm.text}
                  onChange={onNgoChange}
                  rows="5"
                  placeholder="e.g. Flood-affected area needs medical support for 200 families in Kolkata..."
                  required
                />
              </label>
              <label>
                Required Skill
                <select name="requiredSkill" value={ngoForm.requiredSkill} onChange={onNgoChange}>
                  {skillOptions.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </label>
              <label>
                Location
                <select name="location" value={ngoForm.location} onChange={onNgoChange}>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <button className="primary-btn split-submit-btn" type="submit" disabled={isAssigning}>
                {isAssigning ? "Analyzing..." : "Analyze & Assign Volunteer"}
              </button>
            </form>

            {isAssigning ? (
              <section className="process-screen">
                {loadingSteps.map((step, index) => (
                  <div key={step} className={`process-step ${index <= activeStep ? "active" : ""}`}>
                    <span className="dot" />
                    <span>{step}</span>
                  </div>
                ))}
              </section>
            ) : null}
          </section>
        </main>
      ) : null}

      {page === "result" && assignResult ? (
        <main className="page flow-page">
          <section className="section-card">
            <div className="panel-top">
              <h3>Assignment Result</h3>
              <button className="ghost-btn" type="button" onClick={() => setPage("home")}>Back to Home</button>
            </div>
          </section>

          <section className="result-layout">
            <article className="section-card">
              <h3>Need Summary</h3>
              <p>{currentNeedSummary?.text}</p>
              <p><strong>Location:</strong> {currentNeedSummary?.location}</p>
            </article>

            <article className="section-card">
              <h3>AI Analysis</h3>
              <p><strong>Urgency:</strong> <span className={`badge ${assignResult.urgency.toLowerCase()}`}>{assignResult.urgency}</span></p>
              <p><strong>Category:</strong> {assignResult.category}</p>
            </article>

            <article className="section-card">
              <h3>Assigned Volunteer{assignResult.volunteers?.length > 1 ? "s" : ""}</h3>
              {assignResult.volunteers?.length ? (
                <>
                  {assignResult.volunteers.map((volunteer, index) => (
                    <div key={`${volunteer.email || volunteer.phone || volunteer.name}-${index}`}>
                      <p><strong>{volunteer.name}</strong></p>
                      <p>Skills: {(volunteer.skills || []).join(", ")}</p>
                      <p>Location: {volunteer.location}</p>
                      <p>Phone: {volunteer.phone || "N/A"}</p>
                      <p>Email: {volunteer.email || "N/A"}</p>
                      <div className="hero-actions">
                        <a className="primary-btn" href={volunteer.phone ? `tel:${volunteer.phone}` : "#"}>Call</a>
                        <a className="secondary-btn" href={volunteer.email ? `mailto:${volunteer.email}` : "#"}>Email</a>
                      </div>
                      {index < assignResult.volunteers.length - 1 ? <hr /> : null}
                    </div>
                  ))}
                </>
              ) : (
                <p>No volunteer matched yet.</p>
              )}
            </article>

            <article className="section-card">
              <h3>AI Insight (Gemini)</h3>
              <p>{assignResult.summary}</p>
            </article>
          </section>

          <section className="section-card history-card">
            <div className="panel-top">
              <h3>Recent Request Log</h3>
              <button className="ghost-btn" type="button" onClick={() => setPage("ngo")}>Create New Request</button>
            </div>
            {history.length ? (
              <div className="history-list">
                {history.map((item, index) => (
                  <div key={`${item.createdAt}-${index}`} className="history-item">
                    <div>
                      <strong>{item.sourceLocation}</strong> - {item.sourceSkill}
                      <p>{item.sourceText}</p>
                    </div>
                    <span className={`badge ${item.urgency.toLowerCase()}`}>{item.urgency}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No history yet.</p>
            )}
          </section>
        </main>
      ) : null}

      <footer className="footer">
        <div className="footer-top">
          <h3>Volnix AI</h3>
          <p className="footer-tagline">Smart volunteer coordination platform connecting communities with the right help.</p>
        </div>
        
        <div className="footer-links">
          <span className="footer-links-label">Quick Links:</span>
          <button type="button" onClick={() => goToSection("home")}>Home</button>
          <span className="divider">|</span>
          <button type="button" onClick={() => goToSection("features")}>Features</button>
          <span className="divider">|</span>
          <button type="button" onClick={() => goToSection("home")}>Contact</button>
        </div>
        
        <div className="footer-credits">
          <p>© 2026 Volnix AI. All rights reserved.</p>
          <p>Powered by Google AI (Gemini)</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
