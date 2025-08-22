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
              Claire AI — ваш умный фармацевтический аналитик
            </motion.h1>
            <motion.p variants={fadeInUp(0.05)} className="mt-5 text-lg md:text-xl text-brand-fg/80">
              Точные ответы. Быстрые инсайты. Голосовой ассистент для фармацевтической аналитики.
            </motion.p>
            <motion.div variants={fadeInUp(0.1)} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-[var(--neon)] text-black hover:shadow-glow">
                Попробовать демо
              </Button>
              <Button size="lg" variant="outline" className="border-[var(--neon-alt)] text-brand-fg hover:shadow-glowBlue">
                Запросить консультацию
              </Button>
            </motion.div>

            {/* Micro "AI waves" accent */}
            <motion.div
              variants={fadeInUp(0.15)}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              <Waves className="h-4 w-4 text-[var(--neon-alt)]" />
              <span className="text-sm text-brand-fg/70">Голос → инсайт → озвучка</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <motion.h2 variants={fadeInUp()} className="text-2xl md:text-4xl font-semibold text-brand-fg">
              Основные возможности
            </motion.h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Mic, title: "Голосовой ассистент", desc: "Общайтесь голосом и получайте карточки инсайтов." },
                { icon: BarChart3, title: "Фарма-аналитика", desc: "Тренды, прогнозы, отчёты и сравнения." },
                { icon: Sparkles, title: "Карточки-инсайты", desc: "Структурированные ответы для быстрых решений." },
                { icon: Shield, title: "Безопасность", desc: "Локально, в соответствии с HIPAA/GDPR." },
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
              Как это работает (демо)
            </motion.h2>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Query panel */}
              <motion.div variants={fadeInUp(0.05)}>
                <Card className="bg-brand-card/70 border-white/10">
                  <CardContent className="p-6">
                    <p className="text-sm font-mono text-brand-fg/80">Запрос (пример):</p>
                    <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-4 text-[13px] leading-relaxed text-brand-fg/90">
{`"Какие последние тренды на рынке антибиотиков в Центральной Азии за 12 месяцев? Сравни ЙоЙ, укажи топ-бренды и риски."`}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Response panel */}
              <motion.div variants={fadeInUp(0.1)}>
                <Card className="bg-brand-card/70 border-white/10">
                  <CardContent className="p-6">
                    <p className="text-sm font-mono text-brand-fg/80">Ответ Claire (структура):</p>
                    <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-4 text-[13px] leading-relaxed text-brand-fg/90">
{`answer: Краткий вердикт с цифрами и трендом.
card:
  period: "Aug 2024 – Jul 2025"
  yoy_growth: "+8.4%"
  leaders:
    - { brand: "Brand A", share: "19%" }
    - { brand: "Brand B", share: "16%" }
  risks: ["дефициты сырья", "регуляторные изменения"]
  actions: ["увеличить запасы", "пересмотреть ценообразование"]`}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp(0.15)} className="mt-8">
              <Button size="lg" className="bg-[var(--neon-alt)] text-black hover:shadow-glowBlue">Смотреть живое демо</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <motion.h2 variants={fadeInUp()} className="text-2xl md:text-4xl font-semibold text-brand-fg">
              Для кого
            </motion.h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { title: "Фарм-компании", desc: "Рынок, доли, прогнозы, сценарии." },
                { title: "Исследователи/аналитики", desc: "Доступ к данным и быстрые инсайты." },
                { title: "Аптеки/дистрибьюторы", desc: "Ассортимент, спрос, риски, маржа." },
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
              Технология
            </motion.h2>
            <div className="mt-8 grid gap-6 md:grid-cols-4">
              {[
                { step: "1", title: "Whisper", desc: "Транскрибируем голос." },
                { step: "2", title: "GPT-4o", desc: "Анализ и генерация инсайтов." },
                { step: "3", title: "TTS", desc: "Озвучиваем ответ." },
                { step: "4", title: "Интеграции", desc: "Базы фарма-данных и BI." },
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
              Готовы внедрить фармацевтического ассистента?
            </motion.h2>
            <motion.p variants={fadeInUp(0.05)} className="mt-4 text-lg text-brand-fg/80">
              Подключим демо за 1 день и покажем ценность на ваших данных.
            </motion.p>
            <motion.div variants={fadeInUp(0.1)} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-[var(--neon)] text-black hover:shadow-glow">Запросить доступ</Button>
              <Button size="lg" variant="outline" className="border-[var(--neon-alt)] text-brand-fg hover:shadow-glowBlue">Связаться с нами</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}


