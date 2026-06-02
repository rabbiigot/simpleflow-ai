import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Clock,
  MessageSquare,
  Target,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import SigneInContainer from "../singin/signinContainer";
import logoOnly from "../../assets/logoOnly.png";
import namelogo from "../../assets/namelogo.png";
import namelogoWhite from "../../assets/namelogo-white.svg";
import landingPageImg from "../../assets/landingpage.png";
import { listPlans, type PlanData } from "@/lib/backend-api";
import { useNavigate } from "@tanstack/react-router";

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

const GetStartedContainer: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const navigate = useNavigate();

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch(() => {});
  }, []);

  const goSignUp = () => navigate({ to: "/sign-up" });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen bg-background overflow-x-hidden">
      <SigneInContainer open={open} onOpenChange={setOpen} />

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
              onClick={() => setOpen(true)}
            >
              Sign In
            </Button>
            <Button
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={goSignUp}
            >
              Try Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background gradient matching login page style */}
        <div className="absolute inset-x-0 top-0 h-3/5 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/10 opacity-90" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left py-10">
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
                onClick={goSignUp}
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
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-xl h-auto relative">
              <img
                src={landingPageImg}
                alt="SimpleFlow App Mockup"
                className="w-full h-auto object-contain shadow-2xl rounded-[12px] transform translate-y-8"
              />
              <div className="absolute -bottom-10 right-0 w-48 h-48 bg-indigo-300 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob" />
              <div className="absolute -top-10 left-0 w-36 h-36 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob" />
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
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {(plans.length > 0
              ? plans
              : [
                  {
                    id: 0,
                    name: "Free",
                    tier: "FREE" as const,
                    priceMonthly: 0,
                    priceYearly: 0,
                    maxMembers: 3,
                    maxWorkspaces: 2,
                    features: [
                      "3 team members",
                      "2 workspaces",
                      "Basic analytics",
                      "Chat",
                    ],
                    isActive: true,
                  },
                  {
                    id: 0,
                    name: "Starter",
                    tier: "STARTER" as const,
                    priceMonthly: 12,
                    priceYearly: 120,
                    maxMembers: 10,
                    maxWorkspaces: 10,
                    features: [
                      "10 team members",
                      "10 workspaces",
                      "Advanced analytics",
                      "Automations",
                      "Time tracking",
                      "Email support",
                    ],
                    isActive: true,
                  },
                  {
                    id: 0,
                    name: "Pro",
                    tier: "PRO" as const,
                    priceMonthly: 25,
                    priceYearly: 250,
                    maxMembers: 50,
                    maxWorkspaces: -1,
                    features: [
                      "50 team members",
                      "Unlimited workspaces",
                      "AI assistant (Flowmo)",
                      "Custom automations",
                      "Priority support",
                      "Advanced roles",
                      "Finance tracking",
                    ],
                    isActive: true,
                  },
                  {
                    id: 0,
                    name: "Enterprise",
                    tier: "ENTERPRISE" as const,
                    priceMonthly: 60,
                    priceYearly: 600,
                    maxMembers: -1,
                    maxWorkspaces: -1,
                    features: [
                      "Unlimited members",
                      "Unlimited workspaces",
                      "Everything in Pro",
                      "SSO / SAML",
                      "Audit logs",
                      "Dedicated support",
                      "Custom integrations",
                      "SLA guarantee",
                    ],
                    isActive: true,
                  },
                ]
            ).map((plan) => {
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
                      <span className="text-4xl font-semibold text-foreground">
                        ${perMonth}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        /user/mo
                      </span>
                      {billingCycle === "yearly" && plan.priceYearly > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ${plan.priceYearly}/user billed yearly
                        </p>
                      )}
                    </div>
                    <Button
                      className={`w-full mb-6 ${
                        isPro
                          ? "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          : ""
                      }`}
                      variant={isPro ? "default" : "outline"}
                      onClick={goSignUp}
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
            onClick={goSignUp}
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
