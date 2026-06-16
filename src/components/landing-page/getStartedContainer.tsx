import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Clock,
  Megaphone,
  MessageSquare,
  Target,
  Users,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import logoOnly from "../../assets/logoOnly.png";
import namelogo from "../../assets/namelogo.png";
import namelogoWhite from "../../assets/namelogo-white.svg";
import carousel1 from "../../assets/carousel-1.png";
import carousel2 from "../../assets/carousel-2.png";
import carousel3 from "../../assets/carousel-3.png";
import carousel4 from "../../assets/carousel-4.png";
import carousel5 from "../../assets/carousel-5.png";
import { listPlans, type PlanData } from "@/lib/backend-api";
import { useNavigate } from "@tanstack/react-router";

const CAROUSEL_IMAGES = [carousel1, carousel2, carousel3, carousel4, carousel5];

// Cross-fading slides + dots, fills its (positioned) parent.
const HeroSlides: React.FC<{
  slide: number;
  setSlide: (i: number) => void;
}> = ({ slide, setSlide }) => (
  <>
    {CAROUSEL_IMAGES.map((img, i) => (
      <img
        key={i}
        src={img}
        alt={`SimpleFlow preview ${i + 1}`}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
          i === slide ? "opacity-100" : "opacity-0"
        }`}
        loading={i === 0 ? "eager" : "lazy"}
      />
    ))}
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
      {CAROUSEL_IMAGES.map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => setSlide(i)}
          className={`h-1.5 rounded-full transition-all ${
            i === slide ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
          }`}
        />
      ))}
    </div>
  </>
);

// Logo component matching the app's sidebar header style
const Logo = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <img src={logoOnly} alt="SimpleFlow" className="h-9" />
      <img
        src={isDark ? namelogoWhite : namelogo}
        alt="SimpleFlow"
        className="h-5"
      />
    </div>
  );
};

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <Card className="flex flex-col items-center text-center p-6 bg-background-secondary border-[0.5px] shadow-[0_1px_2px_rgba(15,23,42,0.06)] rounded-[12px]">
    <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
    <CardContent className="p-0">
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const TIER_ORDER = ["FREE", "PRO", "TEAM", "ENTERPRISE"];

const GetStartedContainer: React.FC = () => {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch(() => {});
  }, []);

  // Auto-rotate the hero carousel every 4.5s
  useEffect(() => {
    const id = setInterval(
      () => setSlide((s) => (s + 1) % CAROUSEL_IMAGES.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);

  const goSignUp = (planTier?: string) =>
    navigate({
      to: "/sign-up",
      search: planTier ? { plan: planTier } : undefined,
    });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen bg-background overflow-x-hidden">

      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Logo />
          <nav className="hidden md:flex space-x-6 text-sm">
            <button
              onClick={() => scrollTo("features")}
              className="text-muted-foreground hover:text-primary transition"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-muted-foreground hover:text-primary transition"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo("cta")}
              className="text-muted-foreground hover:text-primary transition"
            >
              Contact
            </button>
          </nav>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate({ to: "/login" })}
            >
              Sign In
            </Button>
            <Button
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={() => goSignUp()}
            >
              Try Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient matching login page style */}
        <div className="absolute inset-x-0 top-0 h-3/5 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/10 opacity-90" />

        {/* Desktop: full-bleed carousel pinned to the top-right edge with a slanted left edge */}
        <div
          className="hidden md:block absolute top-0 right-0 bottom-0 w-[56%] overflow-hidden shadow-2xl z-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 20% 100%)" }}
        >
          <HeroSlides slide={slide} setSlide={setSlide} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-12 md:pt-40 md:pb-32">
          <div className="text-left md:max-w-lg lg:max-w-xl">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
              <span className="text-foreground">Flow. Automate.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
                Achieve More.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
              The all-in-one workspace for project management, team chat,
              workflow automation, and AI-powered productivity. Replace 5 tools
              with one.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="text-lg py-7 px-8 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl"
                onClick={() => goSignUp()}
              >
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg py-7 px-8"
                onClick={() => scrollTo("features")}
              >
                See Features
              </Button>
            </div>

            {/* Mobile: in-flow carousel (no slant) */}
            <div className="md:hidden relative aspect-video w-full overflow-hidden rounded-[12px] shadow-2xl mt-10">
              <HeroSlides slide={slide} setSlide={setSlide} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-16 md:py-20 bg-background-secondary border-t border-border"
      >
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-4 text-foreground">
            Everything Your Team Needs
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            One platform that replaces your project manager, chat tool,
            automation engine, and analytics dashboard.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Project Management"
              description="Kanban boards, Gantt charts, and task tracking with custom fields, assignments, and deadlines."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Workflow Automation"
              description="Set triggers, conditions, and actions to automate repetitive work. Like Zapier, built right in."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Team Chat"
              description="Real-time channels, direct messages, file sharing, and emoji reactions. No more switching to Slack."
            />
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="AI Assistant (Flowmo)"
              description="Ask Flowmo to create tasks, generate reports, analyze data, or manage your workspace with natural language."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Time Tracking"
              description="Clock in/out, track hours, manage overtime, and handle leave requests — all built in."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Analytics & Reports"
              description="Productivity insights, task completion trends, time allocation, and exportable PDF/CSV reports."
            />
            <FeatureCard
              icon={<Megaphone className="h-6 w-6" />}
              title="Email Campaigns"
              description="Build contact lists, design email templates, and send campaigns with open and click tracking."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Social Feed"
              description="Share updates with your organization, react, and comment — a private social space for your team."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-4 text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-[10px] bg-secondary p-1">
              <button
                className={`px-4 py-2 rounded-[8px] text-sm font-medium transition ${
                  billingCycle === "monthly"
                    ? "bg-background-secondary shadow text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-[8px] text-sm font-medium transition ${
                  billingCycle === "yearly"
                    ? "bg-background-secondary shadow text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly{" "}
                <span className="text-green-600 dark:text-green-400 text-xs ml-1">
                  Save up to 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {(plans.length > 0
              ? plans
              : ([
                  {
                    name: "Free",
                    tier: "FREE",
                    priceMonthly: 0,
                    priceYearly: 0,
                    features: [
                      "3 team members",
                      "1 workspace",
                      "5 tasks per workspace",
                      "Basic analytics",
                      "Chat",
                    ],
                  },
                  {
                    name: "Pro",
                    tier: "PRO",
                    priceMonthly: 12,
                    priceYearly: 120,
                    features: [
                      "$12 / user / month",
                      "12 org workspaces",
                      "1 personal workspace per member",
                      "Unlimited tasks",
                      "3 automations",
                      "Email campaigns (1 template, 10 lists, 500 sends/mo)",
                      "AI assistant (Flowmo)",
                      "Email support",
                    ],
                  },
                  {
                    name: "Team",
                    tier: "TEAM",
                    priceMonthly: 39,
                    priceYearly: 360,
                    features: [
                      "$39 / user / month",
                      "Unlimited org workspaces",
                      "5 personal workspaces per member",
                      "30 automations (org-wide)",
                      "Email campaigns",
                      "Unlimited contact lists, 5,000 sends/mo",
                      "24/7 SLA priority support",
                    ],
                  },
                  {
                    name: "Enterprise",
                    tier: "ENTERPRISE",
                    priceMonthly: 0,
                    priceYearly: 0,
                    features: [
                      "Custom pricing",
                      "Unlimited everything",
                      "Everything in Team",
                      "SSO / SAML",
                      "Audit logs",
                      "Custom integrations",
                      "24/7 SLA priority support",
                    ],
                  },
                ] as PlanData[])
            )
              .slice()
              .sort(
                (a, b) =>
                  TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
              )
              .map((plan) => {
              const perMonth =
                billingCycle === "yearly"
                  ? Math.round(plan.priceYearly / 12)
                  : plan.priceMonthly;
              const isPro = plan.tier === "PRO";

              return (
                <Card
                  key={plan.tier}
                  className={`relative p-6 rounded-[12px] ${
                    isPro
                      ? "border-primary border-2 shadow-lg"
                      : "border-[0.5px] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  } bg-background-secondary`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-0">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {plan.name}
                    </h3>
                    <div className="mb-6">
                      {plan.tier === "ENTERPRISE" ? (
                        <span className="text-4xl font-semibold text-foreground">
                          Custom
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-semibold text-foreground">
                            ${perMonth}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            /user/mo
                          </span>
                          {billingCycle === "yearly" &&
                            plan.priceYearly > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ${plan.priceYearly}/user billed yearly
                              </p>
                            )}
                        </>
                      )}
                    </div>
                    <Button
                      className={`w-full mb-6 ${
                        isPro
                          ? "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          : ""
                      }`}
                      variant={isPro ? "default" : "outline"}
                      onClick={() => goSignUp(plan.tier)}
                    >
                      {plan.tier === "FREE"
                        ? "Get Started Free"
                        : plan.tier === "ENTERPRISE"
                          ? "Contact Sales"
                          : "Start Free Trial"}
                    </Button>
                    <ul className="space-y-3">
                      {(plan.features as string[]).map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta"
        className="py-20 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 text-white"
      >
        <div className="max-w-5xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 leading-tight">
            Stop Paying for 5 Tools.{" "}
            <span className="text-blue-200">Use One.</span>
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            SimpleFlow replaces your project manager, chat tool, automation
            engine, time tracker, and analytics dashboard — with an AI assistant
            that ties it all together.
          </p>
          <Button
            size="lg"
            className="text-xl py-8 px-10 bg-white text-indigo-700 hover:bg-blue-50 shadow-2xl font-semibold"
            onClick={() => goSignUp()}
          >
            Create My Free Workspace{" "}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-blue-200 mt-4">
            No credit card required. Free forever for small teams.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background-secondary border-t border-border text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} SimpleFlow. All rights reserved.
          </p>
          <div className="flex space-x-6 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition">
              Terms
            </a>
            <a
              href="mailto:support@simpleflow.app"
              className="hover:text-foreground transition"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GetStartedContainer;
