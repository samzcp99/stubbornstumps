"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

export function QuoteForm() {
  const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      if (!endpoint) {
        throw new Error("Form endpoint is not configured.");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Unable to submit quote request right now.");
      }

      form.reset();
      setIsSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
          Name
        </label>
        <input id="name" name="name" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">
          Phone
        </label>
        <input id="phone" name="phone" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label htmlFor="suburb" className="mb-1 block text-sm font-medium text-foreground">
          Suburb
        </label>
        <input id="suburb" name="suburb" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="photo" className="mb-1 block text-sm font-medium text-foreground">
          Photo upload (optional)
        </label>
        <input id="photo" name="photo" type="file" accept="image/*" className="w-full text-sm" />
      </div>

      {isSuccess && <p className="text-sm font-medium text-primary">Thanks! Your quote request was sent successfully.</p>}
      {error && <p className="text-sm font-medium text-accent">{error}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Get Free Quote"}
      </Button>
    </form>
  );
}
