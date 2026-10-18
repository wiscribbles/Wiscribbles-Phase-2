'use client';

/**
 * Phase 2 public sign-up.
 *
 * Four fields. That is the whole brief:
 *   "Public endpoint must only collect full name, email, and password."
 * plus the role selector confirmed on 18 Oct 2026.
 *
 * Replaces `components/SignUpForm2.jsx`, which collected fifteen fields
 * including identification and professional-certificate uploads and — the
 * reason that file is not merely being trimmed — raw card number, expiry and
 * CVV, which it wrote to Firestore in plaintext.
 *
 * Nothing here talks to Firebase directly. The account is created server-side
 * by POST /api/auth/signup so that `role` and `status` are set by the server
 * and cannot be forged by the browser.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Col, Form, FormControl, FormGroup, FormLabel, Row } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { ROLES, ROLE_LABELS } from '@/lib/roles';

/** Must match MIN_PASSWORD_LENGTH in app/api/auth/signup/route.js. */
const MIN_PASSWORD_LENGTH = 10;

const ROLE_OPTIONS = [
  {
    value: ROLES.CLIENT,
    label: 'I need documents signed or notarised',
    hint: 'Sign and notarise your own documents.',
  },
  {
    value: ROLES.NOTARY,
    label: ROLE_LABELS[ROLES.NOTARY],
    hint: 'Notarise documents for clients. Requires approval.',
  },
  {
    value: ROLES.COATH,
    label: ROLE_LABELS[ROLES.COATH],
    hint: 'Commission oaths and declarations. Requires approval.',
  },
  {
    value: ROLES.ATTORNEY,
    label: ROLE_LABELS[ROLES.ATTORNEY],
    hint: 'Share documents with clients for signature. Requires approval.',
  },
  {
    value: ROLES.BUSINESS,
    label: ROLE_LABELS[ROLES.BUSINESS],
    hint: 'Store standard forms for your customers. Requires approval.',
  },
];

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Enter your full name.')
    .max(120, 'Name must be 120 characters or fewer.')
    .required('Enter your full name.'),
  email: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .required('Enter your email address.'),
  password: yup
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .required('Choose a password.'),
  role: yup
    .string()
    .oneOf(ROLE_OPTIONS.map((option) => option.value), 'Choose how you want to use WiScribbles.')
    .required('Choose how you want to use WiScribbles.'),
});

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', role: ROLES.CLIENT },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values) => {
    setFormError(null);

    let response;
    try {
      response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
      return;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (payload.errors) {
        Object.entries(payload.errors).forEach(([field, message]) =>
          setError(field, { type: 'server', message }),
        );
        return;
      }
      setFormError('We could not create your account. Please try again shortly.');
      return;
    }

    /*
     * Deliberately NOT signed in here. The brief gates every dashboard route on
     * email verification, so there is nothing to sign in to yet — and signing
     * in would only produce a session that every guard immediately bounces.
     */
    router.push(`/auth/check-email?email=${encodeURIComponent(values.email)}`);
  };

  return (
    <Form className="signup-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {formError}
        </div>
      )}

      <FormGroup className="mb-3" controlId="signup-name">
        <FormLabel>Full name</FormLabel>
        <FormControl
          type="text"
          autoComplete="name"
          placeholder="Enter your full name"
          isInvalid={Boolean(errors.name)}
          {...register('name')}
        />
        <FormControl.Feedback type="invalid">{errors.name?.message}</FormControl.Feedback>
      </FormGroup>

      <FormGroup className="mb-3" controlId="signup-email">
        <FormLabel>Email address</FormLabel>
        <FormControl
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          isInvalid={Boolean(errors.email)}
          {...register('email')}
        />
        <FormControl.Feedback type="invalid">{errors.email?.message}</FormControl.Feedback>
      </FormGroup>

      <FormGroup className="mb-3" controlId="signup-password">
        <FormLabel>Password</FormLabel>
        <div className="position-relative">
          <FormControl
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            isInvalid={Boolean(errors.password)}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted pe-3"
            style={{ zIndex: 5, textDecoration: 'none' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <FormControl.Feedback type="invalid" className={errors.password ? 'd-block' : ''}>
          {errors.password?.message}
        </FormControl.Feedback>
      </FormGroup>

      <FormGroup className="mb-4">
        <FormLabel className="d-block">Register as</FormLabel>
        <Row className="g-2">
          {ROLE_OPTIONS.map((option) => {
            const checked = selectedRole === option.value;
            return (
              <Col xs={12} key={option.value}>
                <label
                  className="d-flex align-items-start gap-2 p-2 rounded border w-100"
                  style={{
                    cursor: 'pointer',
                    borderColor: checked ? '#274171' : '#dee2e6',
                    background: checked ? 'rgba(39,65,113,0.04)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="form-check-input mt-1 flex-shrink-0"
                    {...register('role')}
                  />
                  <span>
                    <span className="d-block fw-semibold" style={{ fontSize: '0.95rem' }}>
                      {option.label}
                    </span>
                    <span className="d-block text-muted" style={{ fontSize: '0.82rem' }}>
                      {option.hint}
                    </span>
                  </span>
                </label>
              </Col>
            );
          })}
        </Row>
        {errors.role && <div className="text-danger small mt-1">{errors.role.message}</div>}
      </FormGroup>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-100"
        style={{ background: '#0C1134', borderColor: '#0C1134', padding: '0.7rem' }}
      >
        {isSubmitting ? 'Creating your account…' : 'Next'}
      </Button>

      <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.82rem' }}>
        We will email you a link to confirm your address. Your dashboard opens once
        it is confirmed.
      </p>
    </Form>
  );
}
