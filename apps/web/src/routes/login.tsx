import { Link, Navigate } from "react-router";
import { useLogin } from "../auth/use-login";
import { Field, inputClass } from "../components/field";

export function LoginPage() {
  const { fields, errors, onSubmit, isPending, formError, returnTo, alreadyLoggedIn } =
    useLogin();

  if (alreadyLoggedIn) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-xl font-medium">Log in</h1>

      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <Field label="Email" error={errors.email?.message}>
          <input {...fields.email} type="email" autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            {...fields.password}
            type="password"
            autoComplete="current-password"
            className={inputClass}
          />
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
          {isPending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        No account?{" "}
        <Link to="/register" className="text-accent">
          Create one
        </Link>
      </p>
    </main>
  );
}
