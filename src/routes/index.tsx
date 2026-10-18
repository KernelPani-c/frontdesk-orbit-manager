import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, CalendarCheck, PhoneCall, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receptly — AI Receptionist for your business" },
      {
        name: "description",
        content: "Set up your AI receptionist: services, FAQs, appointments and customers in one dashboard.",
      },
      { property: "og:title", content: "Receptly — AI Receptionist for your business" },
      {
        property: "og:description",
        content: "Set up your AI receptionist: services, FAQs, appointments and customers in one dashboard.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Bot, title: "Configure your receptionist", text: "Greeting, tone, hours and handoff rules." },
  { icon: BookOpen, title: "Approved knowledge", text: "Services, prices and FAQs the AI may use." },
  { icon: CalendarCheck, title: "Appointments", text: "Calendar and list views with validation." },
  { icon: PhoneCall, title: "Call history", text: "Ready for real call logs when telephony connects." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </span>
          Receptly
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">AI Receptionist Platform</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            The control panel for your future AI receptionist.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Manage services, FAQs, appointments and customers today. Connect phone calls and voice AI
            when you're ready.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5 shadow-card">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
