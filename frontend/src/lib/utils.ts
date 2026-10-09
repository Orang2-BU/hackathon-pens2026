// Minimal class-name joiner (shadcn-style signature) so 21st.dev components
// can be dropped in. No tailwind-merge on purpose: call sites here pass
// non-conflicting utility groups, and this keeps the dependency tree small.
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
