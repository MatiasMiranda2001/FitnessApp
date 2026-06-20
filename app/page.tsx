import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Dumbbell, Sparkles, Bot, TrendingUp, Check, ArrowRight,
  Camera, ChartLine, ShieldCheck, CreditCard, Zap, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { FitTrackLogo as RendiLogo } from "@/components/fittrack-logo"

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/app")

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* NAV */}
      <nav className="px-4 sm:px-6 py-5 max-w-6xl mx-auto flex items-center justify-between gap-3 relative z-10">
        <RendiLogo size={40} showText />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/login">
            <Button variant="ghost" className="rounded-xl">Iniciar sesión</Button>
          </Link>
          <Link href="/signup" className="hidden sm:block">
            <Button className="rounded-xl bg-brand-gradient text-white shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all">
              Empezar gratis
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-12 pb-20 max-w-6xl mx-auto relative">
        {/* Blob decorativo de fondo */}
        <div
          aria-hidden
          className="absolute -top-20 -right-32 w-[600px] h-[600px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--cream-blob)) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute top-40 -left-32 w-[400px] h-[400px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(263 60% 90%) 0%, transparent 70%)" }}
        />

        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* TEXTO */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nutrición con IA — basado en ciencia</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Tu entrenamiento,
              <br />
              <span className="text-brand-gradient">con datos reales.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Registrá tus rutinas, escaneá tu comida con una foto y entrená con un coach IA que conoce tus objetivos. Todo en una sola app.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 rounded-xl text-base font-bold bg-brand-gradient text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all">
                  Empezar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl text-base font-medium">
                  Ver cómo funciona
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />Sin tarjeta</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />Cancela cuando quieras</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />Datos encriptados</span>
            </div>
          </div>

          {/* PHONE MOCKUP */}
          <div className="relative flex justify-center lg:justify-end mt-8 lg:mt-0 min-h-[600px]">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STATS */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SocialStat number="10K+" label="Usuarios activos" />
          <SocialStat number="450K+" label="Comidas registradas" />
          <SocialStat number="32K+" label="Rutinas completadas" />
          <SocialStat number="4.8★" label="Rating promedio" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">3 pasos para empezar</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StepCard
            n="1"
            icon={<Camera className="h-6 w-6" />}
            title="Escaneá tu comida"
            description="Sacá una foto de tu plato. La IA detecta los ingredientes y calcula calorías y macros en segundos."
          />
          <StepCard
            n="2"
            icon={<TrendingUp className="h-6 w-6" />}
            title="Registrá tu progreso"
            description="Entrenamientos, peso, RPE, agua. Todo en un solo lugar, sincronizado con tu plan."
          />
          <StepCard
            n="3"
            icon={<ChartLine className="h-6 w-6" />}
            title="Mirá tus resultados"
            description="Gráficos limpios para ver cómo cambia tu cuerpo y tu rendimiento semana a semana."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Todo lo que necesitás</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Diseñado para personas que entrenan en serio y quieren resultados medibles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Dumbbell className="h-5 w-5" />}
            title="Sobrecarga progresiva"
            description="Registrá series, repeticiones y RPE. Tu app calcula automáticamente tus 1RM y tu volumen semanal."
          />
          <FeatureCard
            icon={<Camera className="h-5 w-5" />}
            title="Escaneo nutricional con IA"
            description="Sacá una foto de tu plato y obtené calorías, proteína, carbos y grasas en segundos. Powered by Gemini."
          />
          <FeatureCard
            icon={<Bot className="h-5 w-5" />}
            title="Coach personal IA"
            description="Preguntá a un entrenador 24/7 sobre técnica, nutrición o cómo ajustar tu rutina. Entrenado en ciencia."
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Macros precisas"
            description="TDEE, proteína por peso corporal y reparto de carbohidratos calculados según tu objetivo."
          />
          <FeatureCard
            icon={<ChartLine className="h-5 w-5" />}
            title="Progreso visualizado"
            description="Gráficos limpios para ver cómo evolucionan tus marcas y tu adherencia al plan a lo largo del tiempo."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Plantillas validadas"
            description="Empezá con rutinas full-body, push/pull/legs y upper/lower diseñadas con base científica."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Análisis semanal IA · Pro"
            description="Cada domingo recibís un email con tu score de la semana, progreso en el gym y un consejo concreto para la próxima."
          />
        </div>
      </section>

      {/* WEEKLY ANALYSIS HIGHLIGHT — Pro feature */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-primary/20 shadow-xl shadow-primary/10">
          <div className="grid md:grid-cols-2">
            {/* Texto */}
            <div className="p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 w-fit">
                <Zap className="h-3 w-3" /> Solo en Pro
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Tu coach IA analiza tu semana completa
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Cada domingo a las 20hs recibís un email con el cruce de tu nutrición y tus entrenamientos de la semana. Cuántas calorías promediaste, cuánto subiste en tus ejercicios y qué hacer diferente la próxima semana — todo en un solo análisis motivacional.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Score de la semana del 1 al 10", "Comparación de pesos vs semana anterior", "Adherencia calórica y proteica a tu objetivo", "Un tip concreto y accionable para mejorar"].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Preview del email */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs w-full border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">🏃</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Rendi</p>
                    <p className="text-[10px] text-gray-400">hola@rendi.com.ar</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Score de la semana</p>
                <p className="text-4xl font-black text-primary mb-1">8<span className="text-lg text-gray-300">/10</span></p>
                <p className="text-xs font-semibold text-green-600 mb-4">¡Semana excelente!</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>🏋️ Entrenamientos</span><span className="font-bold text-gray-900">4 días</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>🍽️ Kcal promedio</span><span className="font-bold text-gray-900">2.150 kcal</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>📈 Mejor progreso</span><span className="font-bold text-green-600">+5 kg en Sentadilla</span>
                  </div>
                </div>
                <div className="rounded-lg bg-primary p-3">
                  <p className="text-[10px] font-bold text-white/70 uppercase mb-1">⚡ Tu foco esta semana</p>
                  <p className="text-xs text-white font-medium">Agregá una porción de proteína al desayuno para llegar a tu meta diaria.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Lo que dicen</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Personas como vos, transformándose
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <TestimonialCard
            initial="M"
            name="Mariano D."
            role="Buenos Aires · 28 años"
            stars={5}
            text="Bajé 8 kilos en 4 meses y nunca pasé hambre. La parte de escaneo de comida es brutal — registro lo que como en 5 segundos."
          />
          <TestimonialCard
            initial="S"
            name="Sofía R."
            role="Córdoba · 24 años"
            stars={5}
            text="El coach IA me cambió la forma de entrenar. Pregunto cualquier duda y me explica con base científica, no improvisa."
          />
          <TestimonialCard
            initial="J"
            name="Joaquín M."
            role="Rosario · 32 años"
            stars={5}
            text="Por fin una app que entiende los productos que comemos en LatAm. Y los gráficos de progreso son una motivación enorme."
          />
        </div>
      </section>

      {/* PRICING */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Precios</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Empezá gratis</h2>
          <p className="mt-3 text-muted-foreground">
            Mejorá a Pro cuando quieras escaneos ilimitados. Pago seguro con Mercado Pago.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* FREE */}
          <div className="rounded-2xl border-2 border-border p-8 bg-card flex flex-col">
            <p className="text-sm font-medium text-muted-foreground">Free</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">$0</p>
            <p className="text-sm text-muted-foreground">Para siempre</p>
            <ul className="mt-6 space-y-3 text-sm flex-1">
              <PriceItem>Registro de entrenamientos sin límite</PriceItem>
              <PriceItem>Plantillas de rutinas</PriceItem>
              <PriceItem>5 escaneos nutricionales con IA / mes</PriceItem>
              <PriceItem>20 mensajes con AI Coach / mes</PriceItem>
              <PriceItem>Cálculo de TDEE y macros</PriceItem>
            </ul>
            <Link href="/signup" className="block mt-8">
              <Button variant="outline" className="w-full h-12 rounded-xl">Empezar gratis</Button>
            </Link>
          </div>

          {/* PRO MENSUAL */}
          <div className="rounded-2xl border-2 border-border p-8 bg-card flex flex-col">
            <p className="text-sm font-medium text-muted-foreground">Pro · Mensual</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              $7.500<span className="text-base font-normal text-muted-foreground">/mes</span>
            </p>
            <p className="text-sm text-muted-foreground">Cancelá cuando quieras</p>
            <ul className="mt-6 space-y-3 text-sm flex-1">
              <PriceItem>Todo lo del plan Free</PriceItem>
              <PriceItem><strong>Registros de comida ilimitados</strong></PriceItem>
              <PriceItem><strong>AI Coach ilimitado</strong></PriceItem>
              <PriceItem>Historial completo y analíticas avanzadas</PriceItem>
              <PriceItem><strong>Análisis semanal IA por email</strong> — nutrición + gym cruzados</PriceItem>
              <PriceItem>Soporte prioritario</PriceItem>
            </ul>
            <Link href="/signup" className="block mt-8">
              <Button variant="outline" className="w-full h-12 rounded-xl">Probar Pro</Button>
            </Link>
          </div>

          {/* PRO ANUAL */}
          <div className="rounded-2xl border-2 border-primary p-8 bg-gradient-to-br from-primary/5 to-transparent relative shadow-xl shadow-primary/10 flex flex-col">
            <div className="absolute -top-3 left-8 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-brand-gradient text-white shadow-md shadow-primary/30">
              Mejor precio · Ahorrás $15.000
            </div>
            <p className="text-sm font-medium text-primary">Pro · Anual</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              $75.000<span className="text-base font-normal text-muted-foreground">/año</span>
            </p>
            <p className="text-sm text-muted-foreground">Equivale a $6.250/mes · Pago único</p>
            <ul className="mt-6 space-y-3 text-sm flex-1">
              <PriceItem>Todo lo del plan Pro mensual</PriceItem>
              <PriceItem><strong>16% de descuento</strong> sobre el mensual</PriceItem>
              <PriceItem>Análisis semanal IA por email incluido</PriceItem>
              <PriceItem>Acceso garantizado por 12 meses</PriceItem>
              <PriceItem>Sin renovaciones automáticas</PriceItem>
            </ul>
            <Link href="/signup" className="block mt-8">
              <Button className="w-full h-12 rounded-xl bg-brand-gradient text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all">
                Quiero Pro Anual
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Pago con Mercado Pago</span>
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Datos encriptados</span>
          <span className="flex items-center gap-2"><Zap className="h-4 w-4" />Activación inmediata</span>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Preguntas frecuentes</h2>
        </div>

        <div className="space-y-4">
          <FAQItem
            q="¿Cómo funciona el escaneo de comida con IA?"
            a="Sacás una foto de tu plato y nuestro modelo (basado en Gemini de Google) identifica los ingredientes y estima calorías, proteína, carbohidratos y grasas. Tarda menos de 5 segundos."
          />
          <FAQItem
            q="¿Puedo cancelar el plan Pro cuando quiera?"
            a="Sí, en cualquier momento desde tu perfil. Mantenés acceso a las funciones Pro hasta que termine el período por el que pagaste."
          />
          <FAQItem
            q="¿Mis datos están seguros?"
            a="Sí. Usamos Supabase para autenticación y base de datos, con encriptación en tránsito y en reposo. Tus pagos los procesa Mercado Pago — nunca tocamos tus datos financieros directamente."
          />
          <FAQItem
            q="¿Cómo se paga?"
            a="A través de Mercado Pago: podés pagar con dinero en cuenta, transferencia, tarjeta de débito o crédito (incluido cuotas). Vas a ver el método de pago disponible al momento del checkout."
          />
          <FAQItem
            q="¿Funciona en mi celular?"
            a="Sí, Rendi es una web app responsive que funciona perfecto en cualquier celular o computadora. No necesitás bajar nada."
          />
          <FAQItem
            q="¿En qué se basa el cálculo de macros?"
            a="Calculamos tu TDEE con la fórmula Mifflin-St Jeor y ajustamos según tu objetivo (déficit, mantenimiento o superávit). La distribución de proteína se basa en peso corporal, optimizada para retención muscular."
          />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-3xl opacity-50 blur-3xl"
          style={{ background: "radial-gradient(ellipse, hsl(var(--cream-blob)) 0%, transparent 60%)" }}
        />
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Empezá hoy. <span className="text-muted-foreground">Medí mañana.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Creá tu cuenta en menos de 30 segundos.
        </p>
        <Link href="/signup" className="inline-block mt-8">
          <Button size="lg" className="h-12 px-8 rounded-xl text-base font-bold bg-brand-gradient text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all">
            Crear cuenta gratis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <RendiLogo size={32} showText />
          <p>© {new Date().getFullYear()} Rendi. Hecho con ciencia.</p>
        </div>
      </footer>
    </div>
  )
}

/* ----------------------- COMPONENTES AUXILIARES ----------------------- */

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Blob suave detrás del teléfono */}
      <div
        aria-hidden
        className="absolute inset-0 -m-12 rounded-full blur-3xl opacity-70"
        style={{ background: "radial-gradient(ellipse, hsl(var(--cream-blob)) 0%, transparent 65%)" }}
      />

      {/* Teléfono */}
      <div className="relative w-[280px] h-[560px] sm:w-[320px] sm:h-[640px] mx-auto">
        {/* Frame del teléfono */}
        <div className="absolute inset-0 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/40 p-3">
          {/* Pantalla */}
          <div className="relative w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-full z-30" />

            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 px-6 pt-3 pb-1 flex justify-between items-center text-[10px] font-semibold text-white/80 z-20">
              <span>9:41</span>
              <span>●●●●</span>
            </div>

            {/* === FALLBACK: mesa de madera (visible hasta que cargue la foto) === */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #c89968 0%, #a87841 50%, #8b5a2b 100%)",
              }}
            />

            {/* === FOTO REAL DE COMIDA === */}
            {/* La imagen vive en public/hero-plate.jpg.
                Si falta, queda visible la mesa de madera del fallback de arriba. */}
            <img
              src="/hero-plate.jpg"
              alt="Plato de comida"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay para legibilidad de los chips */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/35 z-10" />

            {/* Esquinas de captura tipo cámara */}
            <ScanCorner className="top-16 left-6" rotate={0} />
            <ScanCorner className="top-16 right-6" rotate={90} />
            <ScanCorner className="bottom-32 left-6" rotate={270} />
            <ScanCorner className="bottom-32 right-6" rotate={180} />

            {/* Header overlay */}
            <div className="absolute top-10 left-0 right-0 z-20 text-center">
              <p className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white bg-black/30 backdrop-blur-md rounded-full px-3 py-1">
                <Sparkles className="h-3 w-3" />
                Escaneando con IA
              </p>
            </div>

            {/* Chips de comida detectada - posicionados sobre la foto */}
            <ScanChip className="top-32 left-10" emoji="🧅" name="Cebolla" kcal="29" />
            <ScanChip className="top-44 right-6" emoji="🥕" name="Zanahoria" kcal="24" />
            <ScanChip className="bottom-44 left-4" emoji="🍗" name="Pollo" kcal="330" />
            <ScanChip className="bottom-32 right-8" emoji="🥦" name="Brócoli" kcal="42" />

            {/* CTA en la parte inferior */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total detectado</p>
                    <p className="text-lg font-bold text-foreground">425 kcal</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-bold">P 38g</span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-bold">C 18g</span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-bold">G 12g</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full bg-brand-gradient text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-primary/30"
                >
                  Confirmar y agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Badge IA flotante fuera del teléfono */}
        <div className="absolute -top-2 -right-2 bg-brand-gradient text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-lg shadow-primary/40 flex items-center gap-1.5 z-30">
          <Sparkles className="h-3.5 w-3.5" />
          IA
        </div>
      </div>
    </div>
  )
}

function ScanChip({
  className, emoji, name, kcal,
}: { className?: string; emoji: string; name: string; kcal: string }) {
  return (
    <div className={`absolute z-20 bg-slate-900/85 backdrop-blur-md text-white rounded-full pl-1 pr-2.5 py-1 flex items-center gap-1.5 shadow-lg shadow-slate-900/40 border border-white/10 ${className ?? ""}`}>
      <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-sm">{emoji}</div>
      <div className="leading-tight">
        <p className="text-[11px] font-bold">{name}</p>
        <p className="text-[9px] text-white/70">{kcal} kcal</p>
      </div>
    </div>
  )
}

function ScanCorner({ className, rotate }: { className?: string; rotate: number }) {
  return (
    <div
      className={`absolute z-20 w-6 h-6 ${className ?? ""}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-white rounded-full" />
      <div className="absolute top-0 left-0 w-0.5 h-full bg-white rounded-full" />
    </div>
  )
}

function FeatureCard({
  icon, title, description,
}: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border p-6 bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({
  n, icon, title, description,
}: { n: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border p-6 bg-card relative">
      <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center shadow-md shadow-primary/30">
        {n}
      </div>
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 ml-auto">
        {icon}
      </div>
      <h3 className="font-bold tracking-tight text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({
  initial, name, role, stars, text,
}: { initial: string; name: string; role: string; stars: number; text: string }) {
  return (
    <div className="rounded-2xl border border-border p-6 bg-card">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-foreground">"{text}"</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center">
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-border p-5 bg-card">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <h3 className="font-semibold pr-4">{q}</h3>
        <span className="text-2xl text-muted-foreground transition-transform group-open:rotate-45 leading-none">+</span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
    </details>
  )
}

function PriceItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

function SocialStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-2xl bg-card border border-border shadow-sm">
      <p className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-gradient">
        {number}
      </p>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  )
}
