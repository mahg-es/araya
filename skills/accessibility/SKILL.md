---
name: accessibility
description: "Implement WCAG 2.2 AA accessibility — semantic HTML, ARIA, keyboard navigation,"
---
---

# Accessibility

Implement WCAG 2.2 AA accessibility — semantic HTML, ARIA, keyboard navigation,
screen reader support, color contrast, and focus management — ensuring the
application is usable by everyone, regardless of ability.

## What problem this solves
Inaccessible applications exclude 15-20% of users and violate legal requirements
(ADA, Section 508, EAA). This skill audits for accessibility violations and
produces fixes that make applications perceivable, operable, understandable,
and robust for all users.

## When to use
Before launch. During development (shift left). When an accessibility audit
reveals violations. As a continuous practice, not a one-time fix.

## Input
Application URL or source code, target WCAG level (AA default), assistive
technology requirements.

## Output
```markdown
# Accessibility Audit & Remediation: ARAYA Dashboard

## Audit Summary (WCAG 2.2 AA)
| Principle | Violations | Fixed | Remaining |
|-----------|-----------|-------|-----------|
| Perceivable | 8 | 8 | 0 ✅ |
| Operable | 12 | 10 | 2 🟡 |
| Understandable | 3 | 3 | 0 ✅ |
| Robust | 5 | 5 | 0 ✅ |

## Critical Fixes Applied

### Fix #1: Color contrast (8 violations)
```diff
- color: #94a3b8;  /* 2.8:1 ratio — FAILS AA (needs 4.5:1) */

+ color: #64748b;  /* 4.7:1 ratio — PASSES AA ✅ */
```

### Fix #2: Missing form labels
```diff
- <input type="email" placeholder="Email" />

+ <label htmlFor="email">Email</label>
+ <input id="email" type="email" autocomplete="email" />
```

### Fix #3: Keyboard navigation — modal trap
```tsx
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current!;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when modal opens
    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      // Trap focus inside modal
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    modal.addEventListener("keydown", handleKeyDown);
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return isOpen ? (
    <div role="dialog" aria-modal="true" aria-label="Dialog" ref={modalRef}>
      {children}
    </div>
  ) : null;
}
```

## Accessibility Checklist (Integrated into PR Template)
- [ ] All images have `alt` text (or `alt=""` for decorative)
- [ ] Color contrast meets 4.5:1 (text) / 3:1 (large text)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Escape)
- [ ] Focus visible on all interactive elements (`:focus-visible`)
- [ ] Forms: every input has `<label>`, errors use `role="alert"`
- [ ] Page has skip-to-content link
- [ ] `<html lang="en">` set correctly
- [ ] ARIA used only where HTML semantics are insufficient
- [ ] Screen reader tested (VoiceOver or NVDA) on 3 key flows
```

## POUR Principles (WCAG Foundation)

### Perceivable
- Text alternatives for non-text content (alt text)
- Captions for audio/video
- Content adaptable without losing meaning
- Sufficient color contrast (4.5:1 normal, 3:1 large)
- Content usable at 200% zoom without horizontal scroll

### Operable
- All functionality available from keyboard
- No keyboard traps
- Enough time to read and use content
- No content that causes seizures (< 3 flashes/second)
- Navigable: skip links, descriptive headings, focus order

### Understandable
- Language declared (`<html lang="en">`)
- Predictable: consistent navigation, no unexpected changes
- Input assistance: labels, error messages, help text

### Robust
- Valid, semantic HTML
- ARIA used correctly — when HTML semantics aren't enough
- Compatible with current and future assistive technologies

## Steps
1. Run automated audit: axe DevTools, Lighthouse, or WAVE
2. Manual testing: keyboard navigation, screen reader (VoiceOver/NVDA), 200% zoom
3. Fix violations by priority: Critical (blocks access) → High (major difficulty) → Medium (inconvenience) → Low (best practice)
4. Integrate into development workflow: lint rules (eslint-plugin-jsx-a11y), PR checklist, CI audit
5. Test with real assistive technology users when possible
6. Document accessibility statement for the application

## Rules
- No ARIA is better than bad ARIA — use semantic HTML first
- Every `<img>` must have `alt` (descriptive for content, `alt=""` for decorative)
- Color is never the sole differentiator — add icons, underlines, or patterns
- Focus must always be visible (`:focus-visible`, never `outline: none` without replacement)
- Tab order must follow visual order — don't use `tabindex > 0`
- Modal dialogs: focus trap, Escape to close, focus returns to trigger on close
- Accessibility is continuous, not a launch checklist — audit every sprint
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
