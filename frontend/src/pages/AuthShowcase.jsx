import { BriefcaseBusiness, Check, FileCheck2, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthShowcase({ mode = "login" }) {
  const isSignup = mode === "signup";

  return (
    <aside className="auth-showcase" aria-label="PeopleOps platform introduction">
      <Link className="auth-showcase-brand" to="/login" aria-label="PeopleOps home">
        <img src="/logo.jpg" alt="" />
        <span>PeopleOps</span>
      </Link>

      <div className="auth-showcase-copy">
        <span className="auth-showcase-eyebrow">PEOPLE FIRST. WORKFLOW READY.</span>
        <h2>{isSignup ? "Start your next chapter." : "Great teams start with people."}</h2>
        <p>
          {isSignup
            ? "Create your candidate account and keep every step of your application in one place."
            : "One connected workspace for hiring, onboarding, and growing your people."}
        </p>
      </div>

      <div className="auth-illustration" aria-hidden="true">
        <div className="auth-illustration-glow" />
        <div className="auth-sticker auth-sticker-team">
          <Users size={19} />
          <span>People, together</span>
        </div>
        <div className="auth-sticker auth-sticker-task">
          <span className="auth-sticker-check"><Check size={13} /></span>
          <span>Onboarding complete</span>
        </div>
        <div className="auth-sticker auth-sticker-role">
          <BriefcaseBusiness size={17} />
          <span>New opportunity</span>
        </div>

        <svg className="auth-people-art" viewBox="0 0 520 390" fill="none">
          <path d="M66 331c56-30 119-44 194-44 74 0 136 14 194 44" stroke="#C7DFF0" strokeWidth="3" strokeLinecap="round" />
          <rect x="68" y="106" width="384" height="218" rx="25" fill="#E8F4FB" />
          <rect x="94" y="129" width="332" height="171" rx="17" fill="#fff" />
          <path d="M94 146c0-9.389 7.611-17 17-17h298c9.389 0 17 7.611 17 17v25H94v-25Z" fill="#D9EDF8" />
          <circle cx="116" cy="148" r="4" fill="#6BA8C6" />
          <circle cx="132" cy="148" r="4" fill="#9CC8DA" />
          <circle cx="148" cy="148" r="4" fill="#C0DCE8" />
          <rect x="126" y="194" width="111" height="12" rx="6" fill="#D7E8F1" />
          <rect x="126" y="217" width="162" height="9" rx="4.5" fill="#E7EFF4" />
          <rect x="126" y="236" width="134" height="9" rx="4.5" fill="#E7EFF4" />
          <rect x="126" y="264" width="91" height="19" rx="9.5" fill="#D9F0E7" />
          <path d="M353 205h47v72h-47z" fill="#C7E4F0" />
          <path d="M343 277h67l-9-53h-49l-9 53Z" fill="#A9D2E2" />
          <path d="M349 224h55" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="359" cy="246" r="4" fill="#fff" />
          <circle cx="374" cy="246" r="4" fill="#fff" />
          <circle cx="389" cy="246" r="4" fill="#fff" />
          <path d="M210 296c4-26 20-41 47-42 26-1 44 14 49 42l8 35h-113l9-35Z" fill="#356C88" />
          <path d="M229 262c6 8 15 12 27 12 13 0 22-4 29-12l10 69h-75l9-69Z" fill="#fff" />
          <path d="m250 276 7 11 8-11-8-7-7 7Z" fill="#2B6D8B" />
          <path d="m253 287 4 25 4-25-4-6-4 6Z" fill="#8CC6D8" />
          <path d="M235 241c0-17 10-29 25-29 15 0 25 12 25 29v10c-6 10-14 15-25 15s-19-5-25-15v-10Z" fill="#F2B69D" />
          <path d="M234 241c1-21 11-34 28-34 13 0 23 7 27 22-7-4-13-8-18-14-6 9-17 15-34 17l-3 9Z" fill="#25394B" />
          <circle cx="251" cy="245" r="2" fill="#25394B" />
          <circle cx="269" cy="245" r="2" fill="#25394B" />
          <path d="M254 255c3 2 7 2 10 0" stroke="#B96F67" strokeWidth="2" strokeLinecap="round" />
          <path d="m216 287-25 26 19 14 26-32-20-8ZM296 287l25 26-19 14-26-32 20-8Z" fill="#F2B69D" />
          <path d="M206 324h43v9h-51c0-5 3-9 8-9ZM286 324h43c5 0 8 4 8 9h-51v-9Z" fill="#263D4D" />
          <path d="M207 331h42M286 331h51" stroke="#182A38" strokeWidth="4" strokeLinecap="round" />
          <path d="M184 312v19M331 312v19" stroke="#8CB6C8" strokeWidth="5" strokeLinecap="round" />
          <path d="M115 315h51v9h-51zM120 324h4v11h-4zM157 324h4v11h-4z" fill="#8ABBD0" />
          <path d="M110 315h61" stroke="#5797B2" strokeWidth="5" strokeLinecap="round" />
          <path d="M385 325h35l-5 10h-25l-5-10Z" fill="#73B79D" />
          <path d="M403 324c-3-19-18-25-19-42 16 6 22 17 19 42ZM404 324c2-20 16-28 15-44-15 9-20 22-15 44ZM404 324c-1-15-9-23-8-37 10 8 13 20 8 37Z" fill="#70B99D" />
          <path d="M186 163c16-18 37-28 64-31" stroke="#A8D0E0" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 8" />
        </svg>
        <div className="auth-illustration-caption">
          <FileCheck2 size={16} />
          <span>Every step, in one place</span>
        </div>
      </div>

      <div className="auth-showcase-footer">
        <span>Recruitment</span><i />
        <span>Onboarding</span><i />
        <span>People operations</span>
      </div>
    </aside>
  );
}