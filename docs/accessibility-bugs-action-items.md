# Accessibility & UX Bugs — Action Items

**Source:** Service Request #2149553 (Lawrence Angrave, March 1, 2026)

> WCAG 2.1 AA Compliance is **not optional** for Illinois courses.

---

## Contrast / Visual Issues

| #   | Issue                              | Details                                                                                                                                                                                     |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Code snippet contrast insufficient | Generated code blocks lack sufficient visual contrast in both light and dark modes. The "bash", "Copy code", and download buttons are visible in dark mode but **invisible in light mode**. |
| 2   | "Members" text contrast            | The Members label in Access Control does not meet WCAG 2.1 contrast requirements. Fix contrast or hide if irrelevant.                                                                       |

## Accessibility (ARIA / Semantic HTML)

| #   | Issue                                  | Details                                                                                                |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 3   | Insufficient ARIA tags                 | Page lacks ARIA attributes to correctly describe elements for screen readers.                          |
| 4   | Missing semantic HTML landmarks        | Page uses `<main>` but is missing other critical landmarks like `<nav>`.                               |
| 5   | Code block buttons missing aria-labels | Download/copy buttons in code blocks only have SVG icons with no text labels for assistive technology. |
| 6   | Logo alt text not settable             | When uploading a chatbot logo, there is no way to set alt text on the image.                           |
| 7   | (Nice-to-have) Add skip navigation     | Consider integrating `skipto.js` or similar skip-navigation library.                                   |

## Keyboard Navigation

| #   | Issue                                      | Details                                                                                                                                   |
| --- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | Chatbot table rows not keyboard-accessible | Rows in chatbot list cannot be opened with Enter/Space. Keyboard users cannot navigate to their chats.                                    |
| 9   | AI input field — no visible text selection | Using Shift+Arrow keys in the chat input provides no visual feedback of selection.                                                        |
| 10  | Focus trap in "Sources" panel              | Opening Sources with ~100 documents traps focus; user must Tab 100+ times to escape.                                                      |
| 11  | Hover-only action buttons                  | Message action buttons (copy, thumbs up/down, retry) only visible on mouse hover. **Should** always be visible or reachable via keyboard. |

## Functional Bugs

| #   | Issue                           | Details                                                                                                        |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 12  | Clipboard paste broken          | On Chrome/macOS, cannot paste emails into the admin/member email input field.                                  |
| 13  | Math rendering broken           | Generated LaTeX/math does not render as formatted formulas. When fixed, must also be screen reader accessible. |
| 14  | Cannot update example questions | After setting initial example questions, editing and pressing Submit does nothing.                             |
| 15  | Search field non-functional     | Left sidebar search field does not filter conversations or find text in displayed chat.                        |
| 16  | Privacy status not updating     | After changing sharing to "All logged-in users," chatbot still displays as "Private" in the table.             |

## UX / Labeling

| #   | Issue                  | Details                                                                                                   |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| 17  | Rename "Share Chatbot" | Relabel to "Sharing and Access" or "Access Control" since it controls edit permissions, not just sharing. |

---

## Test Coverage Status

Each issue is mapped to its unit test(s) or documented reason for omission.

### Covered by unit tests

| #   | Issue                           | Test file(s)                                                                             | What is asserted                                                                                                                                                                                 |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Code block contrast             | `CodeBlock.test.tsx`                                                                     | Light-mode header `bg: rgb(232,234,237)`, dark-mode `bg: rgb(33,37,43)`                                                                                                                          |
| 3   | Insufficient ARIA tags          | Multiple `.a11y.test.tsx` files + `axe-audit.a11y.test.tsx`                              | `aria-label` on Send, Copy, Scroll Down, Close, Good/Bad Response, Regenerate, Edit, etc. axe-core scans ~80 WCAG rules per component.                                                           |
| 4   | Missing `<nav>` landmark        | `GlobalHeader.test.tsx`, `GlobalHeader.a11y.test.tsx`                                    | Desktop nav has `role="navigation"` with `aria-label="Main"`                                                                                                                                     |
| 5   | Code block button labels        | `CodeBlock.test.tsx`, `CodeBlock.a11y.test.tsx`                                          | Download button has `aria-label="Download code"`, copy button findable by text "Copy code"                                                                                                       |
| 6   | Logo alt text                   | `ChatNavbar.test.tsx`                                                                    | Logo uses dynamic `alt="${courseName} logo"` (e.g., `CS101 logo`). Implemented in `ChatNavbar.tsx` and `Navbar.tsx`.                                                                             |
| 8   | Table rows keyboard-accessible  | `ProjectTable.test.tsx`, `ProjectTable.a11y.test.tsx`                                    | Rows have `role="button"`, `tabIndex="0"`, Enter and Space keys trigger navigation                                                                                                               |
| 10  | Focus trap in Sources           | `SourcesSidebar.a11y.test.tsx`                                                           | `role="complementary"`, close button label, Escape key closes, null when closed                                                                                                                  |
| 11  | Hover-only action buttons       | `MessageActions.a11y.test.tsx`                                                           | All 4 buttons have `tabIndex=0` (keyboard-focusable), `aria-pressed` toggles on thumbs, `aria-label` on each                                                                                     |
| 12  | Clipboard paste                 | `EmailListAccordion.tsx` (code fix)                                                      | Fixed: `preventDefault()` moved after clipboard data check so paste works when data is available. Not unit-tested (clipboard API requires real browser).                                         |
| 14  | Cannot update example questions | `SetExampleQuestions.test.tsx`, `SetExampleQuestions.a11y.test.tsx`                      | Editing pre-existing question text and saving calls `callSetCourseMetadata` with updated value                                                                                                   |
| 16  | Privacy status not updating     | `ProjectTable.test.tsx`                                                                  | Fixed: ProjectTable now shows 3 labels — "Public", "Logged-in Users", "Private" — based on `is_private` + `allow_logged_in_users`. Test asserts all 3 labels render. Sorting logic also updated. |
| 17  | Rename "Share Chatbot"          | `ShareSettingsModal.test.tsx`, `ShareSettingsModal.a11y.test.tsx`, `UploadCard.test.tsx` | Modal title matches "Sharing and Access"; UploadCard button selector updated                                                                                                                     |

### Standalone accessibility test files (axe-core + ARIA assertions)

| Test file                           | Components covered                                                                                                                                             | Tests                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `axe-audit.a11y.test.tsx`           | CodeBlock, ChatInput, ChatLoader, MessageActions, ProjectTable (empty + rows), ShareSettingsModal, SetExampleQuestions, GlobalHeader, ChatNavbar, Conversation | 11 axe scans (~80 WCAG 2.1 rules each)                    |
| `CodeBlock.a11y.test.tsx`           | CodeBlock                                                                                                                                                      | 3 tests: aria-labels, button accessibility                |
| `ChatInput.a11y.test.tsx`           | ChatInput                                                                                                                                                      | 2 tests: textarea, send button labels                     |
| `ChatLoader.a11y.test.tsx`          | ChatLoader                                                                                                                                                     | 1 test: animation class                                   |
| `ChatMessage.a11y.test.tsx`         | ChatMessage                                                                                                                                                    | 1 test: `aria-live="polite"` on streaming                 |
| `MessageActions.a11y.test.tsx`      | MessageActions                                                                                                                                                 | 6 tests: tabIndex, aria-pressed, aria-label               |
| `Conversation.a11y.test.tsx`        | Conversation sidebar item                                                                                                                                      | 2 tests: button label, rename input label                 |
| `ChatNavbar.a11y.test.tsx`          | ChatNavbar                                                                                                                                                     | 1 test: axe scan                                          |
| `GlobalHeader.a11y.test.tsx`        | GlobalHeader                                                                                                                                                   | 1 test: nav landmark                                      |
| `ShareSettingsModal.a11y.test.tsx`  | ShareSettingsModal                                                                                                                                             | 1 test: axe scan                                          |
| `ProjectTable.a11y.test.tsx`        | ProjectTable                                                                                                                                                   | 1 test: axe scan                                          |
| `SetExampleQuestions.a11y.test.tsx` | SetExampleQuestions                                                                                                                                            | 1 test: axe scan                                          |
| `SourcesSidebar.a11y.test.tsx`      | SourcesSidebar                                                                                                                                                 | 5 tests: landmark, close button, Escape, focus management |

### Additional accessibility tests in regular test files

| Component    | Test file               | What is asserted                                                                             |
| ------------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| ChatInput    | `ChatInput.test.tsx`    | Textarea identifiable by placeholder, send button has `aria-label`                           |
| ChatMessage  | `ChatMessage.test.tsx`  | `aria-live="polite"` present on streaming assistant message content                          |
| ChatNavbar   | `ChatNavbar.test.tsx`   | New Chat, Settings, Dashboard buttons have accessible labels; logo alt text uses course name |
| Conversation | `Conversation.test.tsx` | Button has `aria-label="Select Chat, {name}"`, rename input has `aria-label`                 |

### Manual testing procedures

#### P1 #9 — Headings must be properly nested (WCAG 1.3.1)

**What was fixed:**

- Step titles ("Bring your documents and tools", "Customize LLMs…", "Share with anyone") changed from `<div>` to `<h3>` under their parent `<h2>` section heading
- "Ready to build?" and "Use our API." merged into a single `<h2>` (were two consecutive `<h2>` elements)

**Expected heading hierarchy on landing page (`/`):**

```
h1  Create a chatbot with your content.
 h2  Flagship Chatbots
 h2  It's the easiest way to make your own Chatbot
  h3  Bring your documents and tools
  h3  Customize LLMs, prompts, and tools
  h3  Share with anyone
 h2  Ready to build? Use our API.
 h2  Want something custom?
 h2  About Us
  h3  Support
  h3  Open source
  h3  Developed at Illinois
```

**How to verify:**

1. Open the landing page in Chrome
2. Open DevTools → Elements panel
3. Run in Console: `document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => console.log(h.tagName, h.textContent.trim().substring(0, 60)))`
4. Confirm no heading level is skipped (e.g., no h2→h4 jump) and children are always one level deeper than parents
5. Alternatively, use the [HeadingsMap browser extension](https://chromewebstore.google.com/detail/headingsmap/flbjommegcjonpdmenkdiocclhjacmbi) or the WAVE accessibility tool to visualize the heading tree
6. Run Lighthouse → Accessibility audit and confirm "Heading elements are not in a sequentially-descending order" does not appear

### Not covered — with reasons

| #   | Issue                       | Reason for omission                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | "Members" label contrast    | **CSS-only fix.** Contrast ratios cannot be verified in JSDOM (no computed styles / visual rendering). Requires visual regression testing (e.g., Chromatic) or a Lighthouse CI audit.                                                                                                                                                                                                                                           |
| 7   | Skip navigation             | **Implemented** (`_app.tsx:94` has `<a href="#main-content" class="skip-nav-link">Skip to main content</a>` with CSS in `globals.css:6-22`). **Not unit-tested** because `_app.tsx` requires rendering the full provider hierarchy (Keycloak, PostHog, QueryClient, Mantine, ThemeProvider) — better suited for an **E2E test** with Playwright that verifies Tab → skip link appears → click → focus moves to `#main-content`. |
| 9   | No visible text selection   | **CSS/browser behavior issue.** Text selection highlighting is controlled by `::selection` CSS pseudo-element and browser defaults. Cannot be asserted in JSDOM. Requires manual browser testing.                                                                                                                                                                                                                               |
| 13  | Math rendering broken       | **Investigated.** `rehype-mathjax` and `remark-math` ARE configured in `ChatMessage.tsx` (lines 51-53, 1255-1256). Plugins are imported and used in the ReactMarkdown pipeline. The issue may be missing MathJax CSS/font loading or specific LaTeX edge cases. Needs browser-level testing to confirm rendering output.                                                                                                        |
| 15  | Search field non-functional | **Investigated.** Server-side search works via `search_conversations_v3()` PostgreSQL function. The client-side `filteredConversations` state is dead code. UX issues: no loading indicator during 500ms debounce, no "no results" message. Functional but has UX gaps.                                                                                                                                                         |
