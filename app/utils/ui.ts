/**
 * Shared Tailwind class bundles for repeated UI patterns.
 *
 * WHY THIS FILE EXISTS:
 * Tailwind encourages utility classes in JSX (`className="flex gap-2 …"`).
 * When the same long string appears on many buttons, we extract it here so:
 *   1. Primary buttons all look the same
 *   2. Changing the brand color is one edit
 *
 * Theme colors like `bg-leaf` / `text-ink` come from `@theme` in `app/app.css`.
 * `font-display` is Fraunces (headings/brand); prices use `font-sans` + `tabular-nums`
 * so digits line up and stay easy to scan.
 */

/** Page width + vertical padding used by most screens. */
export const shell =
    "mx-auto w-[min(1100px,calc(100%-2rem))] py-6 pb-10";

/** Big “Highspring” wordmark in the top bar. */
export const brand =
    "font-display text-[clamp(2rem,5vw,3rem)] leading-none text-ink no-underline hover:text-leaf-dark";

/** Primary solid green button (Pay, Add to cart, Admin, …). */
export const btn =
    "inline-flex appearance-none cursor-pointer items-center justify-center rounded-full border-0 bg-leaf px-[1.1rem] py-[0.7rem] font-sans text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55";

/** Outline / secondary button (Sign out, Back to cart, …). */
export const btnSecondary =
    "inline-flex appearance-none cursor-pointer items-center justify-center rounded-full border border-line bg-transparent px-[1.1rem] py-[0.7rem] font-sans text-base font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-55";

/** Small cart actions (Update quantity). */
export const btnCompact =
    "inline-flex appearance-none cursor-pointer items-center whitespace-nowrap rounded-[0.55rem] border border-line bg-white px-[0.55rem] py-[0.3rem] font-sans text-[0.8rem] font-semibold leading-tight text-ink hover:border-ink/30 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-55";

/** Quiet destructive-ish action (Remove, Clear all). */
export const btnGhost =
    "inline-flex appearance-none cursor-pointer items-center whitespace-nowrap rounded-[0.55rem] border border-transparent bg-transparent px-[0.4rem] py-[0.3rem] font-sans text-[0.8rem] font-semibold leading-tight text-muted hover:bg-[#8a2b1c]/10 hover:text-[#8a2b1c] disabled:cursor-not-allowed disabled:opacity-55";

/** Frosted card container (admin sections, checkout panels). */
export const panel =
    "rounded-[1.25rem] border border-line bg-card p-5 shadow-card backdrop-blur-[10px]";

/** Top-of-page intro block (title + short paragraph). */
export const hero = "grid gap-4 py-10 pb-8";

export const heading = "m-0 font-display font-bold tracking-tight text-ink";

export const muted = "m-0 text-[0.95rem] leading-normal text-muted";

/** Large product price on catalog cards — sans + tabular figures for readable money. */
export const price =
    "m-0 font-sans text-[1.55rem] font-bold tabular-nums leading-none tracking-normal text-leaf-dark";

export const priceSm =
    "m-0 font-sans text-[1.2rem] font-bold tabular-nums leading-none tracking-normal text-leaf-dark";

export const priceInline =
    "font-sans text-[1.1rem] font-bold tabular-nums leading-none tracking-normal text-leaf-dark";

/** Cart / checkout grand total. */
export const priceTotal =
    "font-sans text-[1.75rem] font-bold tabular-nums leading-none tracking-normal text-accent";

/** Inline shell commands / config keys on the admin page. */
export const code =
    "rounded-[0.35rem] bg-[#e8e8e8] px-[0.4em] py-[0.15em] font-mono text-[0.9em] text-[#222]";

/**
 * Admin data tables. The `[&_th]:…` syntax means “style child th/td elements”
 * without wrapping every cell in its own className.
 */
export const table =
    "mt-4 w-full border-collapse text-left text-[0.95rem] [&_th]:border-b [&_th]:border-line [&_th]:px-[0.4rem] [&_th]:py-[0.65rem] [&_th]:align-top [&_td]:border-b [&_td]:border-line [&_td]:px-[0.4rem] [&_td]:py-[0.65rem] [&_td]:align-top";

export const qty =
    "w-[4.5rem] rounded-[0.7rem] border border-line bg-white px-[0.55rem] py-[0.45rem] font-sans text-ink";

export const input =
    "w-full rounded-[0.7rem] border border-line bg-white px-3 py-[0.65rem] font-sans text-ink disabled:cursor-not-allowed disabled:opacity-70";
