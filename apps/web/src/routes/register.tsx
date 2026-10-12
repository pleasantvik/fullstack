import { Link } from "react-router";
import { useRegister } from "../auth/use-register";
import { Field, inputClass } from "../components/field";

export function RegisterPage() {
  const { fields, errors, onSubmit, isPending, formError } = useRegister();

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-medium">Create an account</h1>

      {/* noValidate: the browser's own validation bubbles would compete with
          the form's messages. React Hook Form does the checking. */}
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <Field label="Name" error={errors.name?.message}>
          <input {...fields.name} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...fields.email} type="email" autoComplete="email" className={inputClass} />
        </Field>
        {/* new-password, not current-password: it tells a password manager to
            offer to GENERATE one, rather than fill in an existing one. */}
        <Field label="Password" error={errors.password?.message}>
          <input {...fields.password} type="password" autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input {...fields.confirmPassword} type="password" autoComplete="new-password" className={inputClass} />
        </Field>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Already have one?{" "}
        <Link to="/login" className="text-accent">
          Log in
        </Link>
      </p>
    </main>
  );
}
