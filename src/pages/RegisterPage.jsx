import { Link } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import BrandMark from '../components/ui/BrandMark';
import { useTenantOnboarding, ONBOARDING_STEPS } from '../hooks/useTenantOnboarding';
import StepEmailOtp from '../components/onboarding/StepEmailOtp';
import StepRestaurantData from '../components/onboarding/StepRestaurantData';
import StepOwnerAccount from '../components/onboarding/StepOwnerAccount';
import WelcomeSuccessModal from '../components/onboarding/WelcomeSuccessModal';

export default function RegisterPage() {
  const onboarding = useTenantOnboarding();
  const { step, setStep, status, error, setError } = onboarding;

  const stepsList = [
    { n: 1, label: 'Google' },
    { n: 2, label: 'Restaurante' },
    { n: 3, label: 'Dueño & PIN' }
  ];

  return (
    <div className="min-h-screen bg-mantel flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Barra superior de navegación */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-4">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <BrandMark className="h-8 w-auto transition-transform group-hover:scale-105" />
          <span className="font-display font-black text-xl text-tinta tracking-tight">
            Kike's <span className="text-hoja">Food</span>
          </span>
        </Link>
        <Link to="/" className="text-sm font-bold text-suave hover:text-tinta transition-colors">
          Volver al inicio
        </Link>
      </header>

      {/* Tarjeta principal del wizard */}
      <main className="max-w-xl w-full mx-auto my-auto py-4">
        <div className="bg-plato border border-linea rounded-[32px] p-6 sm:p-8 shadow-xl space-y-6">
          {/* Indicador de pasos */}
          {step < ONBOARDING_STEPS.SUCCESS && (
            <div className="space-y-3 pb-2 border-b border-linea">
              {/* Indicador de pasos */}
              <div className="flex items-center justify-between">
                {stepsList.map((s, idx) => {
                  const isDone = step > s.n;
                  const isCurrent = step === s.n;
                  return (
                    <div key={s.n} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                          isDone
                            ? 'bg-hoja text-white'
                            : isCurrent
                            ? 'bg-tinta text-mantel ring-4 ring-tinta/10'
                            : 'bg-linea/60 text-suave'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : s.n}
                      </div>
                      <span
                        className={`text-xs font-bold hidden sm:inline ${
                          isCurrent ? 'text-tinta' : 'text-suave'
                        }`}
                      >
                        {s.label}
                      </span>
                      {idx < stepsList.length - 1 && (
                        <div className="w-8 sm:w-16 h-0.5 bg-linea mx-1 sm:mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Banner de error */}
          {error && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-aji/10 border border-aji/30 text-aji flex items-start gap-2.5 text-sm animate-fadeIn"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Atención</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-aji hover:opacity-70 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Renderizado del paso activo */}
          {step === ONBOARDING_STEPS.EMAIL && (
            <StepEmailOtp
              onGoogleSignIn={onboarding.handleGoogleSignIn}
            />
          )}

          {step === ONBOARDING_STEPS.RESTAURANT && (
            <StepRestaurantData
              restaurantName={onboarding.restaurantName}
              setRestaurantName={onboarding.setRestaurantName}
              customSlug={onboarding.customSlug}
              setCustomSlug={onboarding.setCustomSlug}
              effectiveSlug={onboarding.effectiveSlug}
              slugStatus={onboarding.slugStatus}
              city={onboarding.city}
              setCity={onboarding.setCity}
              phone={onboarding.phone}
              setPhone={onboarding.setPhone}
              onNext={() => setStep(ONBOARDING_STEPS.OWNER)}
              onBack={() => setStep(ONBOARDING_STEPS.EMAIL)}
            />
          )}

          {step === ONBOARDING_STEPS.OWNER && (
            <StepOwnerAccount
              ownerName={onboarding.ownerName}
              setOwnerName={onboarding.setOwnerName}
              pin={onboarding.pin}
              setPin={onboarding.setPin}
              pinConfirm={onboarding.pinConfirm}
              setPinConfirm={onboarding.setPinConfirm}
              status={status}
              onBack={() => setStep(ONBOARDING_STEPS.RESTAURANT)}
              onSubmit={onboarding.handleCreateRestaurant}
            />
          )}

          {step === ONBOARDING_STEPS.SUCCESS && (
            <WelcomeSuccessModal tenant={onboarding.createdTenant} />
          )}
        </div>
      </main>

      {/* Pie de página */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-xs text-suave">
        ¿Ya tienes un restaurante creado?{' '}
        <Link to="/" className="text-tinta font-bold underline hover:text-hoja transition-colors">
          Ingresa al panel del personal
        </Link>
      </footer>
    </div>
  );
}
