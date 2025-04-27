"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full px-4 sm:px-2">
      <form
        className="flex flex-col gap-3 sm:gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((_error) => {
            const toastTitle =
              flow === "signIn"
                ? "Could not sign in, did you mean to sign up?"
                : "Could not sign up, did you mean to sign in?";
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="input-field text-sm sm:text-base py-2.5 sm:py-3"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="input-field text-sm sm:text-base py-2.5 sm:py-3"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button 
          className="auth-button py-2.5 sm:py-3 mt-1 text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" 
          type="submit" 
          disabled={submitting}
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-2 sm:my-3">
        <hr className="my-3 grow border-gray-200 dark:border-gray-700" />
        <span className="mx-3 sm:mx-4 text-xs sm:text-sm text-gray-400 dark:text-gray-500">or</span>
        <hr className="my-3 grow border-gray-200 dark:border-gray-700" />
      </div>
      <button 
        className="auth-button py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
        onClick={() => void signIn("anonymous")}
      >
        Sign in anonymously
      </button>
    </div>
  );
}
