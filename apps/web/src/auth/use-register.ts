import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { ApiError, api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { ME_KEY } from "./use-me";

export interface RegisterFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // onBlur: validate when a field is left, not on every keystroke - errors
  // don't appear mid-word, and typing doesn't trigger validation renders.
  const form = useForm<RegisterFields>({ mode: "onBlur" });

  const mutation = useMutation({
    // confirmPassword is never sent: it exists only to catch a typo here.
    mutationFn: async ({ name, email, password }: RegisterFields) => {
      await api.post("/auth/register", { name, email, password });
      // Register creates the account and NO session - it sets no cookies, by
      // design (1.4a). Logging in with the same credentials is what creates
      // one. Skip this and /auth/me answers 401 and the guard sends a brand-new
      // user to the login page.
      await api.post("/auth/login", { email, password });
    },
    onSuccess: async () => {
      // Wait for the refetch before leaving, for the same reason as login: the
      // guard on the next page reads it.
      await queryClient.invalidateQueries({ queryKey: ME_KEY });
      navigate("/", { replace: true });
    },
    onError: (error) => {
      // The API chose to reveal this in 1.4a; it belongs on the field, not in
      // a banner.
      if (error instanceof ApiError && error.status === 409) {
        form.setError("email", {
          message: "An account with this email already exists.",
        });
      }
    },
  });

  // Rules mirror the server's RegisterDto. They're for the user, not for
  // security - anyone can skip this form and call the API directly - but they
  // must AGREE with it, or people pass this check and fail the server's.
  const fields = {
    name: form.register("name", {
      required: "Enter your name.",
      maxLength: { value: 100, message: "Keep it under 100 characters." },
    }),
    email: form.register("email", { required: "Enter your email." }),
    password: form.register("password", {
      required: "Choose a password.",
      minLength: { value: 12, message: "Use at least 12 characters." },
      maxLength: { value: 128, message: "Keep it under 128 characters." },
    }),
    confirmPassword: form.register("confirmPassword", {
      validate: (value) =>
        value === form.getValues("password") || "Passwords don't match.",
    }),
  };

  const isConflict =
    mutation.error instanceof ApiError && mutation.error.status === 409;

  return {
    fields,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    // A 409 is already shown on the email field; everything else is general.
    formError:
      mutation.error && !isConflict ? describeError(mutation.error) : null,
  };
}
