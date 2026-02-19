// src/components/SimpleFlowLandingPage.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import { Sign } from "crypto";
import { ArrowRight, BarChart3, Target, Zap } from "lucide-react";
import React, { useState } from "react";
import SigneInContainer from "../singin/signinContainer";
import SFpng from "../../src/assets/SF.png"
import landingPageImg from "../../src/assets/landingpage.png" 

// IMPORTANT: Replace this with your actual logo component or image path
const Logo = () => (
  <div className="flex items-center text-xl font-bold text-gray-800 dark:text-white">
    <img
      src= {SFpng}
      alt="SimpleFlow Logo"
      className="h-15 w-25"
    />
    SimpleFlow
  </div>
);

// --- Feature Card Component ---
interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <Card className="flex flex-col items-center text-center p-6 border-none shadow-none bg-transparent">
    <div className="p-4 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">
      {title}
    </h3>
    <CardContent className="p-0">
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </CardContent>
  </Card>
);

// --- Main Landing Page Component ---
const GetStartedContainer: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <SigneInContainer open={open} onOpenChange={setOpen} />
      {/* 1. Navigation Bar (Simplified) */}
      <header className="absolute top-0 left-0 w-full z-20 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Logo />
          <nav className="hidden md:flex space-x-6 text-sm">
            <a
              href="#"
              className="text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-500"
            >
              Features
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-500"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-500"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-gray-700 dark:text-gray-300"
              onClick={() => setOpen(true)}
            >
              Sign In
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700">
              Try Free
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden">
        {/* Background Gradient - Mimics the soft orange/peach tone from the generated image */}
        <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-br from-orange-100 to-red-50 dark:from-gray-900 dark:to-orange-950/20 opacity-90"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side: Marketing Text */}
          <div className="text-left py-10">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
              <span className="text-gray-900 dark:text-white">
                Flow. Automate.
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Achieve More.
              </span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-md">
              SimpleFlow is the workspace for Task Management, Workflow
              Automation, and Team Collaboration. Turn complexity into clarity.
            </p>
            <Button
              size="lg"
              className="text-lg py-7 px-8 bg-orange-600 hover:bg-orange-700 transition duration-300 shadow-xl"
            >
              Start Free Trial Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Right Side: Laptop Image/Graphic (Mockup Placeholder) */}
          <div className="flex justify-center md:justify-end">
            {/* This div acts as the placeholder for the 3D laptop/app mockup image. 
              In a real app, you would use your background image/JPG here. 
            */}
            <div className="w-full max-w-xl h-auto relative">
              <img
                src={landingPageImg} // **Replace this path**
                alt="SimpleFlow App Mockup on Laptop"
                className="w-full h-auto object-contain shadow-2xl rounded-lg transform translate-y-8"
              />
              <div className="absolute -bottom-10 right-0 w-48 h-48 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Row */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950 border-t dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Designed for Simplicity and Power
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Advanced Task Management"
              description="Plan, execute, and track all your projects with Kanban boards, lists, and calendar views."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Workflow Automation"
              description="Automate repetitive tasks, set up triggers, and free up hours for strategic work."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Real-time Collaboration"
              description="Keep your team in sync with instant chat, shared documents, and streamlined review cycles."
            />
          </div>
        </div>
      </section>

      {/* 4. Call to Action (CTA) Footer - Dark/High-Contrast Section */}
      <section className="py-20 bg-gray-900 dark:bg-black text-white">
        <div className="max-w-5xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Stop Managing Work. Start{" "}
            <span className="text-orange-500">Achieving Goals</span>.
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Get SimpleFlow for your team and streamline your success today.
          </p>
          <Button
            size="lg"
            className="text-xl py-8 px-10 bg-red-600 hover:bg-red-700 transition duration-300 shadow-2xl"
          >
            Create My SimpleFlow Workspace
          </Button>
        </div>
      </section>
    </div>
  );
};

export default GetStartedContainer;
