import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { requestPasswordReset } from "@/features/auth/auth.api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your name.")
      .max(60, "Keep your name under 60 characters."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters for your password."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Your passwords do not match.",
  });
const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-mark" aria-hidden="true">
          <ShieldCheck size={19} />
        </div>
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </div>
    </section>
  );
}

function PasswordField({
  id,
  label,
  error,
  register,
  autoComplete,
}: {
  id: string;
  label: string;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrap">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          error={error}
          {...register}
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function FormAlert({ message }: { message: string }) {
  return (
    <p className="auth-form-error" role="alert">
      {message}
    </p>
  );
}

export function SignInPage() {
  const { user, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (
    location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
  )?.from;
  const destination = from?.pathname
    ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
    : "/account";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), mode: "onBlur" });

  if (isLoading) return null;
  if (user) return <Navigate to="/account" replace />;

  async function submit(values: SignInValues) {
    setFormError("");
    setIsSubmitting(true);
    try {
      await signIn(values.email, values.password);
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="WELCOME BACK"
      title="Good to see you."
      description="Sign in to keep your neighborhood's lost-and-found moving."
    >
      <form
        className="auth-form"
        noValidate
        onSubmit={handleSubmit(submit)}
        onChange={() => setFormError("")}
      >
        {formError && <FormAlert message={formError} />}
        <div className="auth-field">
          <label htmlFor="sign-in-email">Email address</label>
          <Input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
        <PasswordField
          id="sign-in-password"
          label="Password"
          error={errors.password?.message}
          register={register("password")}
          autoComplete="current-password"
        />
        <div className="auth-form-link-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="auth-submit" loading={isSubmitting}>
          Sign in <ArrowRight size={16} />
        </Button>
      </form>
      <div className="auth-demo-note">
        <strong>Try the demo</strong>
        <span>alex@example.com · password123</span>
      </div>
      <p className="auth-switch">
        New to the neighborhood? <Link to="/sign-up">Create an account</Link>
      </p>
    </AuthFrame>
  );
}

export function SignUpPage() {
  const { user, isLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema), mode: "onBlur" });

  if (isLoading) return null;
  if (user) return <Navigate to="/account" replace />;

  async function submit(values: SignUpValues) {
    setFormError("");
    setIsSubmitting(true);
    try {
      await signUp(values.name, values.email, values.password);
      navigate("/account", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="JOIN THE NEIGHBORHOOD"
      title="A little help goes a long way."
      description="Create an account to keep track of your reports, claims, and conversations."
    >
      <form
        className="auth-form"
        noValidate
        onSubmit={handleSubmit(submit)}
        onChange={() => setFormError("")}
      >
        {formError && <FormAlert message={formError} />}
        <div className="auth-field">
          <label htmlFor="sign-up-name">Your name</label>
          <Input
            id="sign-up-name"
            autoComplete="name"
            placeholder="Alex Morgan"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-email">Email address</label>
          <Input
            id="sign-up-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
        <PasswordField
          id="sign-up-password"
          label="Password"
          error={errors.password?.message}
          register={register("password")}
          autoComplete="new-password"
        />
        <PasswordField
          id="sign-up-confirm-password"
          label="Confirm password"
          error={errors.confirmPassword?.message}
          register={register("confirmPassword")}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="auth-submit" loading={isSubmitting}>
          Create account <ArrowRight size={16} />
        </Button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const { user, isLoading } = useAuth();
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), mode: "onBlur" });

  if (isLoading) return null;
  if (user) return <Navigate to="/account" replace />;

  async function submit(values: ForgotValues) {
    setFormError("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="ACCOUNT RECOVERY"
      title={sent ? "Check your inbox." : "Forgot your password?"}
      description={
        sent
          ? "If an account exists for that address, you'll receive a link to reset your password."
          : "Enter the email address on your account and we'll send you a reset link."
      }
    >
      {sent ? (
        <div className="auth-success-state">
          <Mail size={24} aria-hidden="true" />
          <Link className="ui-button ui-button--primary ui-button--lg auth-submit" to="/sign-in">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          className="auth-form"
          noValidate
          onSubmit={handleSubmit(submit)}
          onChange={() => setFormError("")}
        >
          {formError && <FormAlert message={formError} />}
          <div className="auth-field">
            <label htmlFor="forgot-email">Email address</label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <Button type="submit" size="lg" className="auth-submit" loading={isSubmitting}>
            Send reset link <ArrowRight size={16} />
          </Button>
        </form>
      )}
      <p className="auth-switch">
        <Link to="/sign-in">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
