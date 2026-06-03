import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Link2, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Globe, 
  Zap, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft" style={{ animationDelay: '2s' }}></div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Linkly
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition-colors duration-200">Testimonials</a>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link 
            to="/signup" 
            className="text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-105"
          >
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation URL Management Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-tight animate-slide-up">
          Shorten, Share, and{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Analyze Everything
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          A enterprise-ready SaaS tool to generate custom, password-protected, and branded links with lightning-fast redirects and modern analytics breakdowns.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link 
            to="/signup" 
            className="w-full sm:w-auto flex items-center justify-center space-x-2 text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 rounded-xl shadow-xl shadow-indigo-500/20 hover:scale-105 hover:shadow-indigo-500/35 transition-all duration-300"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a 
            href="#features" 
            className="w-full sm:w-auto border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 px-8 py-4 rounded-xl text-slate-300 font-semibold transition-all duration-300"
          >
            Learn More
          </a>
        </div>

        {/* CSS Mockup of Dashboard */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-950 p-4 shadow-2xl shadow-indigo-500/5 animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent blur-2xl -z-10 rounded-2xl"></div>
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
            </div>
            <div className="bg-slate-900/60 text-slate-500 text-xs px-12 py-1 rounded-lg border border-slate-900">
              linkly.app/dashboard
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-900/80 text-left">
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Links</div>
              <div className="text-2xl font-bold text-slate-100">12,482</div>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-900/80 text-left">
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Clicks</div>
              <div className="text-2xl font-bold text-indigo-400">452,109</div>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-900/80 text-left">
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Avg Click-Through Rate</div>
              <div className="text-2xl font-bold text-emerald-400">42.8%</div>
            </div>
          </div>

          <div className="h-64 bg-slate-900/30 rounded-xl border border-slate-900/80 flex items-center justify-center p-6">
            <div className="w-full h-full flex flex-col justify-end">
              {/* Mock Bar chart */}
              <div className="flex items-end justify-between h-40 gap-2 px-4">
                <div className="w-full bg-indigo-500/20 rounded-t h-[40%] animate-pulse-soft"></div>
                <div className="w-full bg-indigo-500/30 rounded-t h-[65%]"></div>
                <div className="w-full bg-indigo-500/45 rounded-t h-[50%]"></div>
                <div className="w-full bg-indigo-500/60 rounded-t h-[80%]"></div>
                <div className="w-full bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t h-[95%]"></div>
                <div className="w-full bg-indigo-500/70 rounded-t h-[75%]"></div>
                <div className="w-full bg-indigo-500/40 rounded-t h-[60%]"></div>
              </div>
              <div className="border-t border-slate-900 pt-3 flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-slate-900 relative">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Packed with Powerful Features</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Linkly offers every tool you need to scale your online footprint, secure your links, and analyze audience behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 border border-slate-900 hover:border-slate-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Lightning Resolution</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Highly optimized URL resolution with Redis lookups ensures users are redirected in milliseconds.
            </p>
          </div>

          <div className="bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 border border-slate-900 hover:border-slate-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Deep Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Analyze browser types, devices, operating systems, referrers, and countries of your audience.
            </p>
          </div>

          <div className="bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 border border-slate-900 hover:border-slate-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6 border border-fuchsia-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Link Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Secure links with password protection and set expiration limits based on clicks or calendar dates.
            </p>
          </div>

          <div className="bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 border border-slate-900 hover:border-slate-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-6 border border-sky-500/20">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Team Workspaces</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Invite your teammates to work in shared workspaces with custom access roles and collective links.
            </p>
          </div>

          <div className="bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 border border-slate-900 hover:border-slate-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Custom Aliases</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ditch ugly random hashes. Create custom text links to improve brand recognition and CTR.
            </p>
          </div>

          <div className="bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 border border-slate-900 hover:border-slate-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-6 border border-rose-500/20">
              <Link2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">API Keys</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Developers first. Generate API credentials to shorten and track URLs directly from your software code.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-32 border-t border-slate-900">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Choose the plan that is right for you, or start for free and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-slate-900/10 rounded-2xl p-8 border border-slate-900 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-400 mb-2">Free</h3>
              <div className="text-4xl font-extrabold mb-6">$0</div>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">Perfect for personal projects, blogs, and testing core features.</p>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>50 Active Links</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Standard Redirection</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Basic 7-day Analytics</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-500 line-through">
                  <span>Custom Aliases</span>
                </li>
              </ul>
            </div>
            <Link to="/signup" className="block text-center border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 py-3 rounded-xl font-medium transition-all">
              Start Free
            </Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="bg-slate-900/30 rounded-2xl p-8 border-2 border-indigo-500/80 relative flex flex-col justify-between shadow-xl shadow-indigo-500/5">
            <span className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </span>
            <div>
              <h3 className="text-lg font-bold text-indigo-400 mb-2">Pro</h3>
              <div className="text-4xl font-extrabold mb-6">$12<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">For professional creators, marketers, and scaling businesses.</p>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Unlimited Links</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Custom Aliases & QR Codes</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Deep Analytics (30-day history)</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Password Protected Links</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Team Workspace (5 members)</span>
                </li>
              </ul>
            </div>
            <Link to="/signup" className="block text-center bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-3 rounded-xl font-medium shadow-lg hover:from-indigo-600 hover:to-violet-700 transition-all hover:scale-105">
              Get Started
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-slate-900/10 rounded-2xl p-8 border border-slate-900 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-400 mb-2">Enterprise</h3>
              <div className="text-4xl font-extrabold mb-6">Custom</div>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">For corporations requiring scale, SLA uptime, and API integrations.</p>
              <ul className="space-y-4 mb-8 text-sm">
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>API Integration Access</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Unlimited Workspace Users</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>99.99% Uptime Guarantee</span>
                </li>
              </ul>
            </div>
            <Link to="/signup" className="block text-center border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 py-3 rounded-xl font-medium transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-32 border-t border-slate-900">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Teams Worldwide</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Here's what our users are saying about Linkly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/20 rounded-2xl p-6 border border-slate-900">
            <p className="text-slate-300 italic mb-6 leading-relaxed">
              "We migrated to Linkly from Bitly and reduced our billing by 80% while gaining faster redirect speeds. The API works flawlessly."
            </p>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">SM</div>
              <div>
                <div className="text-sm font-bold">Sarah Miller</div>
                <div className="text-xs text-slate-500">Marketing Lead at Vercel</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/20 rounded-2xl p-6 border border-slate-900">
            <p className="text-slate-300 italic mb-6 leading-relaxed">
              "The ability to password protect link resolutions and check browser analytics instantly has made sharing documents with clients so much safer."
            </p>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">DB</div>
              <div>
                <div className="text-sm font-bold">David Brown</div>
                <div className="text-xs text-slate-500">Founder, Alpha agency</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/20 rounded-2xl p-6 border border-slate-900">
            <p className="text-slate-300 italic mb-6 leading-relaxed">
              "Team workspaces are highly intuitive. We share short links between devs and designers and coordinate marketing campaigns without sharing accounts."
            </p>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">LH</div>
              <div>
                <div className="text-sm font-bold">Leo Hughes</div>
                <div className="text-xs text-slate-500">VP Product, linear.app</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-900/40 via-violet-950/40 to-slate-950 border-y border-slate-900 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.1),transparent)] -z-10"></div>
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Supercharge Your Links?</h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-10 text-sm md:text-base leading-relaxed">
          Create an account in 30 seconds. No credit card required to start shortening and analyzing.
        </p>
        <Link 
          to="/signup" 
          className="inline-flex items-center space-x-2 text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 rounded-xl shadow-xl shadow-indigo-500/25 hover:scale-105 hover:shadow-indigo-500/40 transition-all duration-300"
        >
          <span>Get Started Free</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Link2 className="h-4 w-4 text-indigo-400" />
          <span className="font-bold text-slate-400">Linkly</span>
          <span>© 2026 Majji Pradeep Kumar. All rights reserved.</span>
        </div>

        <div className="flex space-x-6">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
