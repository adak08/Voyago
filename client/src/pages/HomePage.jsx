import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plane, MapPin, DollarSign, MessageCircle, Sparkles, Users,
  ArrowRight, Star, Menu, X, Sun, Moon, Map, Shield,
  CheckCircle, Calendar, Zap, Globe, ChevronDown
} from "lucide-react";
import { useThemeStore } from "../store/themeStore";

/* ─── Data ─── */
const FEATURES = [
  {
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    pill: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    title: "AI Itinerary Generator",
    desc: "Describe your vibe — adventure, relaxation, luxury — and our AI builds a complete day-by-day plan in seconds.",
  },
  {
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
    pill: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    title: "Smart Expense Splitting",
    desc: "Track every rupee. Auto-calculate who owes whom with equal or custom splits. Zero awkward conversations.",
  },
  {
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
    pill: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    title: "Real-time Group Chat",
    desc: "Live typing indicators, instant sync, full message history — all in one place instead of 47 WhatsApp threads.",
  },
  {
    icon: Users,
    color: "from-orange-500 to-rose-500",
    pill: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    title: "Instant Invites",
    desc: "Share a unique code. Anyone joins in one click — no app download, no friction, no excuses.",
  },
  {
    icon: Map,
    color: "from-pink-500 to-rose-600",
    pill: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    title: "Live Itinerary Board",
    desc: "Edit activities, adjust timing, add stops. Changes sync instantly across every device in the group.",
  },
  {
    icon: Shield,
    color: "from-slate-500 to-gray-600",
    pill: "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400",
    title: "Secure by Default",
    desc: "JWT auth, OTP email verification, encrypted refresh tokens. Your trip data stays yours.",
  },
];

const STEPS = [
  { step: "01", icon: MapPin,    color: "bg-primary-500",  title: "Create a Trip",       desc: "Set destination, dates, and budget in under a minute." },
  { step: "02", icon: Users,     color: "bg-violet-500",   title: "Invite Your Squad",   desc: "Share the invite code — friends join instantly." },
  { step: "03", icon: Sparkles,  color: "bg-emerald-500",  title: "AI Builds the Plan",  desc: "Generate a full itinerary tailored to your group's vibe." },
  { step: "04", icon: CheckCircle, color: "bg-orange-500", title: "Travel & Track",      desc: "Log expenses, chat live, stay perfectly in sync." },
];

const TESTIMONIALS = [
  { name: "Priya M.",  loc: "Mumbai → Goa",    avatar: "P", color: "bg-violet-500",  text: "Planned a 6-person Goa trip in 20 minutes. The AI itinerary nailed it and expense splitting saved us SO many arguments 😂", stars: 5 },
  { name: "Rahul S.",  loc: "Delhi → Manali",  avatar: "R", color: "bg-blue-500",    text: "The live chat + synced itinerary is a game changer. No more 40 WhatsApp groups for one trip. This is the future.", stars: 5 },
  { name: "Ananya K.", loc: "Blr → Coorg",     avatar: "A", color: "bg-emerald-500", text: "Clean, fast, actually works. We've used it for 3 trips now. The AI suggestions were surprisingly accurate.", stars: 5 },
];

const DESTINATIONS = [
  { name: "Goa",       emoji: "🏖️", count: "2.4k" },
  { name: "Manali",    emoji: "🏔️", count: "1.8k" },
  { name: "Jaipur",    emoji: "🏰", count: "1.5k" },
  { name: "Kerala",    emoji: "🌴", count: "1.2k" },
  { name: "Ladakh",    emoji: "🗻", count: "980" },
  { name: "Rishikesh", emoji: "🛶", count: "860" },
];

/* ─── Scroll reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0, y = 24 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ─── Main Component ─── */
export default function HomePage() {
  const { dark, toggle } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-x-hidden">

      {/* ══════════════════ NAV ══════════════════ */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-glass shadow-sm" : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Plane className="text-white" size={17} />
            </div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">TripSync</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            {[["#features","Features"],["#how-it-works","How it works"],["#reviews","Reviews"]].map(([href, label]) => (
              <a key={href} href={href}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="theme-toggle" aria-label="Toggle dark mode">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login" className="hidden md:block btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm hidden md:flex">
              Get Started <ArrowRight size={14} />
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden theme-toggle">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-surface-900 border-t border-gray-100 dark:border-surface-850 px-4 py-4 space-y-1 shadow-xl animate-fade-in">
            {[["#features","Features"],["#how-it-works","How it works"],["#reviews","Reviews"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500">
                {label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary w-full justify-center text-sm">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center text-sm">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{backgroundImage:"linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(to right,#6366f1 1px,transparent 1px)",backgroundSize:"60px 60px"}} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 text-primary-600 dark:text-primary-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 animate-fade-up"
            style={{ animationDelay: "0ms" }}>
            <Sparkles size={12} className="animate-spin-slow" />
            AI-Powered Smart Trip Planner
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-6 animate-fade-up"
            style={{ animationDelay: "80ms" }}>
            Plan group trips<br />
            <span className="gradient-text">without the chaos</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up"
            style={{ animationDelay: "160ms" }}>
            AI itineraries, real-time group chat, and smart expense splitting — everything your squad needs to travel smarter, together.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Link to="/register"
              className="btn-primary px-8 py-3.5 text-base font-bold shadow-xl shadow-primary-500/25">
              Start planning free <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works"
              className="btn-secondary px-8 py-3.5 text-base font-semibold">
              See how it works <ChevronDown size={16} />
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500 animate-fade-up"
            style={{ animationDelay: "320ms" }}>
            <div className="flex -space-x-2.5">
              {["P","R","A","K","S"].map((l, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-surface-900 flex items-center justify-center text-xs font-bold text-white ${
                  ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-orange-500","bg-rose-500"][i]
                }`}>{l}</div>
              ))}
            </div>
            <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">8,000+</strong> travellers planning smarter</span>
            <span className="hidden sm:flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
              <span className="ml-1">4.9/5</span>
            </span>
          </div>
        </div>

        {/* Floating destinations strip */}
        <div className="absolute bottom-8 left-0 right-0 overflow-hidden animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="flex gap-3 justify-center flex-wrap px-4">
            {DESTINATIONS.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-surface-850 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:-translate-y-1 transition-transform cursor-default shadow-sm">
                <span>{d.emoji}</span> {d.name}
                <span className="text-gray-400 dark:text-gray-600">·</span>
                <span className="text-gray-400 dark:text-gray-500">{d.count} trips</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Zap size={11} /> Everything you need
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Built for how groups<br className="hidden sm:block" /> actually travel
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              No more spreadsheets, no more confusion. One app handles it all.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className="group card p-6 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1.5 transition-all duration-300 h-full">
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${f.pill}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-[var(--bg-2)]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Globe size={11} /> Simple process
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Trip planned in<br className="hidden sm:block" /> four steps
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto">
              From zero to full itinerary in less time than it takes to pick a restaurant.
            </p>
          </Reveal>

          <div className="relative">
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-violet-200 to-emerald-200 dark:from-primary-900/60 dark:via-violet-900/60 dark:to-emerald-900/60" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Reveal key={i} delay={i * 100}>
                    <div className="relative text-center group">
                      <div className={`relative w-20 h-20 ${s.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:-translate-y-1.5 transition-transform duration-300`}>
                        <Icon className="text-white" size={28} />
                        <span className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-white dark:bg-surface-900 border-2 border-gray-100 dark:border-surface-850 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-600 dark:text-gray-400">
                          {s.step}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{s.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <Reveal className="text-center mt-12" delay={400}>
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base font-bold shadow-lg shadow-primary-500/20">
              Try it now — it's free <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ REVIEWS ══════════════════ */}
      <section id="reviews" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Star size={11} className="fill-current" /> Real travellers
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Loved by groups<br className="hidden sm:block" /> everywhere
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="card p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1 mb-5">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 border-t border-gray-100 dark:border-surface-850 pt-4">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {t.loc}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Stats row */}
          <Reveal className="mt-14" delay={200}>
            <div className="card p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x-0 sm:divide-x divide-gray-100 dark:divide-surface-850 text-center">
                {[
                  { val: "8,000+", label: "Travellers" },
                  { val: "3,200+", label: "Trips Planned" },
                  { val: "₹12M+",  label: "Expenses Tracked" },
                  { val: "4.9 ★",  label: "Average Rating" },
                ].map((s, i) => (
                  <div key={i} className="px-4">
                    <p className="text-3xl font-extrabold gradient-text mb-1">{s.val}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-[var(--bg-2)]">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
            Your next adventure<br /> starts <span className="gradient-text">right here</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of groups who've swapped group-chat chaos for one beautifully organised trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-10 py-4 text-base font-bold shadow-xl shadow-primary-500/25">
              Create your free account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary px-10 py-4 text-base font-semibold">
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
            No credit card required · Free forever for small groups
          </p>
        </Reveal>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="border-t border-gray-100 dark:border-surface-850 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Plane className="text-white" size={13} />
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-200">TripSync</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © 2025 TripSync. Built for travellers, by travellers.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-600">
            <a href="#features" className="hover:text-primary-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-500 transition-colors">How it works</a>
            <Link to="/login" className="hover:text-primary-500 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
