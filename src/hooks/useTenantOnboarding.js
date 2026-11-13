import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { slugify, isValidSlug } from '../lib/slug';

export const ONBOARDING_STEPS = {
  EMAIL: 1,
  RESTAURANT: 2,
  OWNER: 3,
  SUCCESS: 4
};

export function useTenantOnboarding() {
  const [step, setStep] = useState(ONBOARDING_STEPS.EMAIL);
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending_otp' | 'otp_sent' | 'verifying_otp' | 'otp_verified' | 'creating' | 'success'
  const [error, setError] = useState(null);

  // Datos del formulario
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [previewOtp, setPreviewOtp] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [restaurantName, setRestaurantName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: null, error: null });
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const [createdTenant, setCreatedTenant] = useState(null);

  // Detectar sesión de Google al cargar la página
  useEffect(() => {
    let active = true;
    if (api.getAuthUser) {
      api.getAuthUser().then((user) => {
        if (active && user && user.email) {
          setEmail(user.email);
          setIsEmailVerified(true);
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (fullName) setOwnerName(fullName);
          setStep((cur) => cur === ONBOARDING_STEPS.EMAIL ? ONBOARDING_STEPS.RESTAURANT : cur);
        }
      }).catch(() => {
        /* sin sesión */
      });
    }
    return () => { active = false; };
  }, []);

  // Temporizador de reenvío (cooldown de 60 s)
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendCooldown]);

  // Slug efectivo (calculado al vuelo)
  const effectiveSlug = useMemo(() => {
    return customSlug.trim() ? slugify(customSlug) : slugify(restaurantName);
  }, [customSlug, restaurantName]);

  // Verificación debounceada de disponibilidad de slug
  useEffect(() => {
    if (!effectiveSlug || !isValidSlug(effectiveSlug)) {
      setSlugStatus({ checking: false, available: null, error: effectiveSlug ? 'Enlace no válido' : null });
      return;
    }

    let active = true;
    setSlugStatus({ checking: true, available: null, error: null });
    const timeout = setTimeout(async () => {
      try {
        const res = await api.checkSlugAvailable(effectiveSlug);
        if (active) {
          setSlugStatus({
            checking: false,
            available: res.available,
            error: res.available ? null : (res.error || 'Enlace ocupado')
          });
        }
      } catch (err) {
        if (active) {
          setSlugStatus({ checking: false, available: false, error: err.message });
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [effectiveSlug]);

  // Acción: Iniciar con Google OAuth
  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    try {
      if (api.signInWithGoogle) {
        await api.signInWithGoogle();
      }
    } catch (err) {
      setError(err.message || 'No se pudo conectar con Google');
    }
  }, []);

  // Acción: Solicitar código OTP al correo
  const handleSendOtp = useCallback(async (targetEmail) => {
    const clean = (targetEmail || email).trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Escribe un correo electrónico válido');
      return false;
    }
    setStatus('sending_otp');
    setError(null);
    setPreviewOtp(null);
    try {
      const res = await api.sendOnboardingOtp(clean);
      setEmail(clean);
      setStatus('otp_sent');
      setResendCooldown(60);
      if (res?.previewOtp) {
        setPreviewOtp(res.previewOtp);
      }
      return true;
    } catch (err) {
      setError(err.message || 'No se pudo enviar el código de verificación');
      setStatus('idle');
      return false;
    }
  }, [email]);

  // Acción: Validar código OTP de 6 dígitos
  const handleVerifyOtp = useCallback(async (codeToVerify) => {
    const cleanCode = (codeToVerify || otpCode).trim();
    if (cleanCode.length !== 6) {
      setError('El código debe ser de 6 dígitos');
      return false;
    }
    setStatus('verifying_otp');
    setError(null);
    try {
      await api.verifyOnboardingOtp({ email, code: cleanCode });
      setOtpCode(cleanCode);
      setIsEmailVerified(true);
      setStatus('otp_verified');
      setStep(ONBOARDING_STEPS.RESTAURANT);
      return true;
    } catch (err) {
      setError(err.message || 'Código incorrecto o expirado');
      setStatus('otp_sent');
      return false;
    }
  }, [email, otpCode]);

  // Acción: Crear el restaurante (Paso Final)
  const handleCreateRestaurant = useCallback(async () => {
    if (!isEmailVerified) {
      setError('Debes verificar tu correo primero');
      return false;
    }
    if (!restaurantName.trim()) {
      setError('Escribe el nombre de tu restaurante');
      return false;
    }
    if (!slugStatus.available) {
      setError(slugStatus.error || 'El enlace web no está disponible');
      return false;
    }
    if (!ownerName.trim()) {
      setError('Escribe tu nombre');
      return false;
    }
    if (!/^[0-9]{4,6}$/.test(pin)) {
      setError('El PIN debe tener entre 4 y 6 dígitos numéricos');
      return false;
    }
    if (pin !== pinConfirm) {
      setError('Los dos PIN ingresados no coinciden');
      return false;
    }

    setStatus('creating');
    setError(null);
    try {
      const res = await api.registerTenant({
        email,
        code: otpCode || 'GOOGLE_OAUTH',
        name: restaurantName.trim(),
        slug: effectiveSlug,
        phone: phone.trim() || null,
        city: city.trim() || null,
        ownerName: ownerName.trim(),
        pin
      });

      setCreatedTenant(res);
      setStatus('success');
      setStep(ONBOARDING_STEPS.SUCCESS);
      return res;
    } catch (err) {
      setError(err.message || 'Ocurrió un error creando el restaurante');
      setStatus('idle');
      return false;
    }
  }, [
    isEmailVerified, email, otpCode, restaurantName, effectiveSlug,
    slugStatus, ownerName, pin, pinConfirm, phone, city
  ]);

  return {
    step,
    setStep,
    status,
    error,
    setError,

    // Step 1: Google Auth
    email,
    setEmail,
    otpCode,
    setOtpCode,
    previewOtp,
    isEmailVerified,
    resendCooldown,
    handleSendOtp,
    handleVerifyOtp,
    handleGoogleSignIn,

    // Step 2: Restaurant
    restaurantName,
    setRestaurantName,
    customSlug,
    setCustomSlug,
    effectiveSlug,
    slugStatus,
    phone,
    setPhone,
    city,
    setCity,

    // Step 3: Owner
    ownerName,
    setOwnerName,
    pin,
    setPin,
    pinConfirm,
    setPinConfirm,

    // Step 4: Finalize
    createdTenant,
    handleCreateRestaurant
  };
}
