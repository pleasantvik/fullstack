import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { ApiError, api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { ME_KEY, useMe } from "./use-me";

export interface LoginFields {
  email: string;
  password: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const me = useMe();

  // onBlur: validate when a field is left, not on every keystroke - errors
  // don't appear mid-word, and typing doesn't trigger validation renders.
  const form = useForm<LoginFields>({ mode: "onBlur" });

  // From router state, not a ?next= query parameter. A query parameter can be
  // put in a link by anyone - "log in here" pointing at your own login page,
  // then redirecting somewhere hostile afterwards. That's an open redirect.
  // History state can't be set from outside the app.
  const from = (useLocation().state as { from?: Location } | null)?.from;
  const returnTo = from ? `${from.pathname}${from.search}${from.hash}` : "/";

  const login = useMutation({
    mutationFn: (body: LoginFields) => api.post("/auth/login", body),
    onSuccess: async () => {
      // Login answers 204: the response IS the cookies, with no user in it. So
      // ask again who we are, and wait for the answer before leaving - the
      // guard on the next page reads it.
      await queryClient.invalidateQueries({ queryKey: ME_KEY });
      navigate(returnTo, { replace: true });
    },
  });

  // Presence only - deliberately no length rules, matching LoginDto rather than
  // RegisterDto. A minimum would lock out anyone whose password predates a
  // policy change, and "must be at least 12 characters" tells an attacker
  // something about a guess before anything has checked it.
  const fields = {
    email: form.register("email", { required: "Enter your email." }),
    password: form.register("password", {
      required: "Enter your password.",
    }),
  };

  // Form-level, never on a field: attaching it to email or password would tell
  // an attacker which of the two was wrong.
  const formError = !login.error
    ? null
    : login.error instanceof ApiError && login.error.status === 401
      ? "Invalid email or password."
      : describeError(login.error);

  return {
    fields,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit((values) => login.mutate(values)),
    isPending: login.isPending,
    formError,
    returnTo,
    // The decision is logic, so it lives here; rendering <Navigate> on it is
    // presentation, so that stays in the page.
    alreadyLoggedIn: me.data != null,
  };
}
