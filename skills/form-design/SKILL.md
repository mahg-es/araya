---
name: form-design
description: "Design and implement accessible, validated forms with clear error states,"
---
---

# Form Design

Design and implement accessible, validated forms with clear error states,
loading indicators, and submission handling — forms that users can complete
quickly and correctly.

## What problem this solves
Poorly designed forms frustrate users, generate bad data, and lose conversions.
This skill produces forms with real-time validation, clear error messages,
keyboard navigation, and accessible markup — forms that guide users to success.

## When to use
When building any data entry form: login, registration, settings, checkout,
search, or data submission.

## Input
Form fields with types, validation rules, submission endpoint.

## Output
```tsx
// src/components/UserForm/UserForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import styles from "./UserForm.module.css";

const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "admin"]),
});

type UserFormData = z.infer<typeof userSchema>;

export function UserForm({ onSubmit }: {
  onSubmit: (data: UserFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Submission failed",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={styles.form}
      noValidate
      aria-label="User form"
    >
      <div className={styles.field}>
        <label htmlFor="name">Name</label>
        <Input
          id="name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className={styles.error} role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className={styles.error} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {errors.root && (
        <div className={styles.formError} role="alert">
          {errors.root.message}
        </div>
      )}

      <Button type="submit" loading={isSubmitting}>
        Create User
      </Button>
    </form>
  );
}
```

## Steps
1. Define the form schema with Zod or Yup — types, required fields, validation rules
2. Wire up form library (react-hook-form, Formik, or native)
3. For each field:
   - `<label>` with `htmlFor` matching input `id`
   - Input with appropriate type (email, password, number, tel, url)
   - `aria-invalid` when error present
   - `aria-describedby` pointing to error message element
   - Error message with `role="alert"` for screen readers
4. Handle form states:
   - **Empty**: Initial state, submit button active
   - **Validating**: Real-time validation on blur/change
   - **Error**: Field-level errors with specific messages
   - **Submitting**: Button disabled, loading indicator
   - **Success**: Redirect or success message
   - **Server Error**: Form-level error message
5. Add `noValidate` to form to use custom validation (not browser default)
6. Test keyboard navigation: Tab through fields, Enter to submit, Escape to cancel

## Rules
- Every input must have a visible `<label>` — placeholder is not a label
- Error messages must say what to fix, not just that something is wrong: "Email is required" not "Error"
- Real-time validation on blur, not on every keystroke (too aggressive)
- Form-level errors for server/network failures; field-level errors for validation
- `noValidate` on `<form>` — use custom validation, not browser defaults
- Support Enter to submit, Escape to cancel in modals
- Autocomplete attributes (`autocomplete="email"`, `autocomplete="new-password"`) for UX
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
