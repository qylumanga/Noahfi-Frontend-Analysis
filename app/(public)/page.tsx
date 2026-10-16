import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Benefits } from "@/components/marketing/Benefits";
import { Security } from "@/components/marketing/Security";
import { Banks } from "@/components/marketing/Banks";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Canadian credit assessment for newcomers",
  description: "Convert your home-country banking and credit history into a Canadian-equivalent credit profile. Result within 48 hours.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Security />
        <Banks />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
