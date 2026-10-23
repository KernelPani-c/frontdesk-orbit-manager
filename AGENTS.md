<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All app data is scoped by `business_id`; RLS uses `is_business_member` / `is_business_admin` security-definer helpers — never rely on frontend filtering.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate); shared UI helpers live in `src/components/common.tsx`.
- Demo rows carry `is_sample = true` and must be shown with the Sample badge; dashboard metrics are always computed from stored rows.
- Integrations may only reach status `connected` via server-side verification (a DB trigger blocks clients from setting it).
- Future AI-agent bookings should go through a server route that checks availability; the appointments overlap trigger is the final guard.
