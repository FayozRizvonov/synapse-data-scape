import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles, Shield, BarChart3, Waves } from "lucide-react";
import Glow from "@/components/ai/Glow";
import { motion } from "framer-motion";
import { fadeInUp, stagger, scaleIn } from "@/lib/motion";

export default function ClaireLanding() {
  return (
    <main className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <Glow />
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="max-w-3xl"
          >
            <motion.h1 variants={fadeInUp()} className="text-4xl md:text-6xl font-semibold tracking-tight text-brand-fg">
              Claire AI — your smart pharmaceutical analyst
            </motion.h1>
            <motion.p variants={fadeInUp(0.05)} className="mt-5 text-lg md:text-xl text-brand-fg/80">
              Accurate answers. Quick insights. Voice assistant for pharmaceutical analytics.
            </motion.p>
            <motion.div variants={fadeInUp(0.1)} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-[var(--neon)] text-black hover:shadow-glow">
                Try demo
              </Button>
              <Button size="lg" variant="outline" className="border-[var(--neon-alt)] text-brand-fg hover:shadow-glowBlue">
                Request consultation
              </Button>
            </motion.div>

            {/* Micro "AI waves" accent */}
            <motion.div
              variants={fadeInUp(0.15)}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              <Waves className="h-4 w-4 text-[var(--neon-alt)]" />
                              <span className="text-sm text-brand-fg/70">Voice → insight → speech</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <motion.h2 variants={fadeInUp()} className="text-2xl md:text-4xl font-semibold text-brand-fg">
              Key Features
            </motion.h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Mic, title: "Voice Assistant", desc: "Communicate by voice and receive insight cards." },
                { icon: BarChart3, title: "Pharma Analytics", desc: "Trends, forecasts, reports and comparisons." },
                { icon: Sparkles, title: "Insight Cards", desc: "Structured responses for quick decisions." },
                { icon: Shield, title: "Security", desc: "Local, compliant with HIPAA/GDPR." },
              ].map(({ icon: I, title, desc }, i) => (
                <motion.div key={title} variants={scaleIn(i * 0.05)}>
                  <Card className="bg-brand-card/70 border-white/10 hover:shadow-glow transition">
                    <CardContent className="p-6">
                      <I className="h-6 w-6 text-[var(--neon)]" />
                      <h3 className="mt-4 text-lg font-medium text-brand-fg">{title}</h3>
                      <p className="mt-2 text-sm text-brand-fg/70">{desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* DEMO */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <motion.h2 variants={fadeInUp()} className="text-2xl md:text-4xl font-semibold text-brand-fg">
              How it works (demo)
            </motion.h2>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Query panel */}
              <motion.div variants={fadeInUp(0.05)}>
                <Card className="bg-brand-card/70 border-white/10">
                  <CardContent className="p-6">
                    <p className="text-sm font-mono text-brand-fg/80">Query (example):</p>
                    <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-4 text-[13px] leading-relaxed text-brand-fg/90">
{`"What are the latest trends in the antibiotic market in Central Asia over the past 12 months? Compare YoY, indicate top brands and risks."`}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Response panel */}
              <motion.div variants={fadeInUp(0.1)}>
                <Card className="bg-brand-card/70 border-white/10">
                  <CardContent className="p-6">
                    <p className="text-sm font-mono text-brand-fg/80">Claire's response (structure):</p>
                    <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-4 text-[13px] leading-relaxed text-brand-fg/90">
{`answer: Brief verdict with numbers and trend.
card:
  period: "Aug 2024 – Jul 2025"
  yoy_growth: "+8.4%"
  leaders:
    - { brand: "Brand A", share: "19%" }
    - { brand: "Brand B", share: "16%" }
  risks: ["raw material shortages", "regulatory changes"]
  actions: ["increase inventory", "review pricing"]`}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp(0.15)} className="mt-8">
              <Button size="lg" className="bg-[var(--neon-alt)] text-black hover:shadow-glowBlue">Watch live demo</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <motion.h2 variants={fadeInUp()} className="text-2xl md:text-4xl font-semibold text-brand-fg">
              For whom
            </motion.h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { title: "Pharma companies", desc: "Market, shares, forecasts, scenarios." },
                { title: "Researchers/analysts", desc: "Data access and quick insights." },
                { title: "Pharmacies/distributors", desc: "Assortment, demand, risks, margin." },
              ].map((i, idx) => (
                <motion.div key={i.title} variants={scaleIn(idx * 0.05)} className="rounded-2xl border border-white/10 bg-brand-card/60 p-6 hover:shadow-glow transition">
                  <h3 className="text-lg font-medium text-brand-fg">{i.title}</h3>
                  <p className="mt-2 text-sm text-brand-fg/70">{i.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TECH PIPELINE */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <motion.h2 variants={fadeInUp()} className="text-2xl md:text-4xl font-semibold text-brand-fg">
              Technology
            </motion.h2>
            <div className="mt-8 grid gap-6 md:grid-cols-4">
              {[
                { step: "1", title: "Whisper", desc: "Voice transcription." },
                { step: "2", title: "GPT-4o", desc: "Analysis and insight generation." },
                { step: "3", title: "TTS", desc: "Voice response." },
                { step: "4", title: "Integrations", desc: "Pharma databases and BI." },
              ].map((s, idx) => (
                <motion.div key={s.step} variants={scaleIn(idx * 0.05)} className="relative rounded-2xl border border-white/10 bg-brand-card/60 p-6">
                  <div className="absolute -top-3 left-6 rounded-full bg-[var(--neon)] px-3 py-1 text-xs font-semibold text-black shadow-glow">{s.step}</div>
                  <h3 className="mt-3 text-lg font-medium text-brand-fg">{s.title}</h3>
                  <p className="mt-2 text-sm text-brand-fg/70">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="max-w-3xl">
            <motion.h2 variants={fadeInUp()} className="text-3xl md:text-5xl font-semibold text-brand-fg">
              Ready to implement a pharmaceutical assistant?
            </motion.h2>
            <motion.p variants={fadeInUp(0.05)} className="mt-4 text-lg text-brand-fg/80">
              We'll set up a demo in 1 day and show value on your data.
            </motion.p>
            <motion.div variants={fadeInUp(0.1)} className="mt-8 flex flex-wrap gap-3">
                             <Button size="lg" className="bg-[var(--neon)] text-black hover:shadow-glow">Request access</Button>
               <Button size="lg" variant="outline" className="border-[var(--neon-alt)] text-brand-fg hover:shadow-glowBlue">Contact us</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}



