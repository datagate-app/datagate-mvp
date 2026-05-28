import { JsonLd } from "@/components/JsonLd";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { MvpSection } from "@/components/landing/MvpSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <JsonLd />
      {/* Skip link - dostępność klawiaturowa */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Pomiń do treści
      </a>
      <Header />
      <main id="main">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <DashboardPreview />
        <FeaturesSection />
        <ModulesSection />
        <AudienceSection />
        <MvpSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
