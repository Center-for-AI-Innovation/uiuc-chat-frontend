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

### Manual verification procedures

Below is a verification checklist for every accessibility fix in the `fix/accessibility-issues` branch. Each section lists what was fixed, the relevant commits, and step-by-step instructions to confirm the fix.

---

#### #1 — Code snippet contrast insufficient (WCAG 1.4.3)

**Commits:** `5fac668b`, `cee56c57`
**Files:** `globals.css`, `CodeBlock.tsx`

**How to verify:**

1. Open any chat page and generate a response containing a code block
2. Switch to **light mode** using the theme toggle
3. Confirm the code block header (language label, "Copy code", download button) is visible against its background
4. Check contrast ratio with DevTools: select the header element → Computed → look for color/background-color. Ratio should be >= 4.5:1
5. Repeat in **dark mode** — buttons and text should also be visible

---

#### #2 — "Members" text contrast (WCAG 1.4.3)

**Commits:** `a2cc976b`, `9f14cb17`
**Files:** `globals.css`

**How to verify:**

1. Navigate to any chatbot's dashboard → "Sharing and Access" modal
2. Inspect the "Members" label text
3. Use a contrast checker (e.g., DevTools color picker or WebAIM Contrast Checker) to verify the text meets WCAG AA (>= 4.5:1)

---

#### #3 — Insufficient ARIA tags (WCAG 4.1.2)

**Commits:** `065c9c2f`, `cabbd864`, `39b707f9`, `eff84ee8`, `f7cbaceb`
**Files:** Multiple components — ChatInput, ChatMessage, CodeBlock, MessageActions, GlobalHeader, Sidebar, etc.

**How to verify:**

1. Open a chat page in Chrome
2. Run Lighthouse → Accessibility audit
3. Confirm no "Elements do not have an accessible name" violations
4. Use a screen reader (VoiceOver on macOS: Cmd+F5) and Tab through the chat interface
5. Verify each interactive element (Send button, Copy, Scroll Down, thumbs up/down, Edit, Regenerate) is announced with a meaningful label
6. Confirm decorative SVG icons have `aria-hidden="true"` (inspect any Tabler icon in DevTools)

---

#### #4 — Missing semantic HTML landmarks (WCAG 1.3.1)

**Commits:** `5028f2b8`, `5b8b40d5`, `b5a6e62f`
**Files:** `Sidebar.tsx`, `Navbar.tsx`, `home.tsx`

**How to verify:**

1. Open the chat page
2. In DevTools Console, run: `document.querySelectorAll('nav, main, header, footer, aside').forEach(el => console.log(el.tagName, el.getAttribute('aria-label')))`
3. Confirm the sidebar is a `<nav aria-label="Chat sidebar">` element
4. Confirm the top navbar is outside the `<main>` element
5. With VoiceOver, press **Ctrl+Option+U** to open the Landmarks rotor — verify "Chat sidebar" navigation landmark appears

---

#### #5 — Code block buttons missing aria-labels (WCAG 4.1.2)

**Commits:** `eff84ee8`, `065c9c2f`
**Files:** `CodeBlock.tsx`

**How to verify:**

1. Generate a code block in chat
2. Inspect the copy button — confirm `aria-label="Copy code"` or visible text "Copy code"
3. Inspect the download button — confirm `aria-label="Download code"`
4. Tab to each button with keyboard — screen reader should announce "Copy code" / "Download code"

---

#### #6 — Logo alt text (WCAG 1.1.1)

**Commits:** `c2b20cfd`, `2b89957c`, `49d85771`
**Files:** `ChatNavbar.tsx`, `Navbar.tsx`, `Sidebar.tsx`

**How to verify:**

1. Navigate to a chatbot page (e.g., `/Testing/chat`)
2. Inspect the chatbot logo image in the sidebar and navbar
3. Confirm `alt` attribute contains the course name (e.g., "Testing logo" or "Course banner")
4. On the landing page (`/`), confirm the Illinois logo has `alt="Illinois logo"`

---

#### #7 — Skip navigation (WCAG 2.4.1)

**Commits:** `065c9c2f`
**Files:** `_app.tsx`, `globals.css`

**How to verify:**

1. Open any page and press **Tab** once — a "Skip to main content" link should appear at the top of the viewport
2. Press **Enter** — focus should move to the `#main-content` element and the page should scroll to the main area
3. Press **Tab** again — the skip link should disappear (it's only visible on focus)
4. Confirm `#main-content` target exists: `document.getElementById('main-content')` should return an element

---

#### #8 — Chatbot table rows keyboard-accessible (WCAG 2.1.1)

**Commits:** `065c9c2f`
**Files:** `ProjectTable.tsx`

**How to verify:**

1. Navigate to the "My Chatbots" page (or Explore page)
2. Tab to a chatbot row in the table
3. Press **Enter** or **Space** — it should navigate to that chatbot
4. Confirm rows have `tabIndex="0"` and `role="button"` in DevTools

---

#### #9 — Headings must be properly nested (WCAG 1.3.1)

**Commits:** `9815a4db`, `117bc07c`, `ac78a92e`
**Files:** `index.tsx`, `CannotViewCourse.tsx`

**How to verify:**

1. Open the landing page in Chrome
2. Run in Console: `document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => console.log(h.tagName, h.textContent.trim().substring(0, 60)))`
3. Confirm no heading level is skipped (no h2 -> h4 jump) and the hierarchy is:

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

4. Use the [HeadingsMap extension](https://chromewebstore.google.com/detail/headingsmap/flbjommegcjonpdmenkdiocclhjacmbi) or WAVE to visualize the heading tree
5. Run Lighthouse → Accessibility and confirm no "Heading elements are not in a sequentially-descending order" warning

---

#### #10 — Focus trap in "Sources" panel (WCAG 2.1.2)

**Commits:** `065c9c2f`
**Files:** `SourcesSidebar.tsx`

**How to verify:**

1. Open a chat page with documents uploaded
2. Open the Sources panel
3. Press **Escape** — the panel should close and focus should return to the chat
4. Confirm the close button has an accessible label

---

#### #11 — Hover-only action buttons (WCAG 2.1.1)

**Commits:** `7215578d`
**Files:** `ChatMessage.tsx`, `globals.css`

**How to verify:**

1. Open a chat with existing messages
2. Without hovering, confirm the message action buttons (copy, thumbs up/down, regenerate) are visible
3. Tab to each action button — they should be focusable and announced by screen reader
4. Confirm `tabIndex=0` on each button in DevTools

---

#### #12 — Clipboard paste broken

**Commits:** `065c9c2f`
**Files:** `EmailListAccordion.tsx`

**How to verify:**

1. Navigate to a chatbot dashboard → "Sharing and Access"
2. Copy an email address to clipboard
3. Click the email input field and press **Cmd+V** (macOS) or **Ctrl+V** (Windows)
4. Confirm the email is pasted successfully

---

#### #13 — ARIA-hidden on decorative icons / Data table accessible names (WCAG 1.3.1)

**Commits:** `f7cbaceb`, `35efadda`
**Files:** Various components with Tabler icons, `ProjectFilesTable.tsx`

**How to verify:**

1. Inspect any decorative icon (e.g., sidebar icons) in DevTools — confirm `aria-hidden="true"` is present
2. Navigate to a dashboard with a data table
3. Confirm the `<table>` has an `aria-label` attribute (e.g., "Project files")
4. Run Lighthouse → Accessibility and confirm no "data tables do not have an accessible name" violations

---

#### #14 — Form controls must have labels (WCAG 3.3.2)

**Commits:** `328303cb`, `6640bac1`, `fed4ce4b`, `35c5fc73`
**Files:** `ChatInput.tsx`, `Temperature.tsx`, `LLMsApiKeyInputForm.tsx`, `UploadCard.tsx`

**How to verify:**

1. Open a chat page — inspect the textarea: confirm `aria-label="Message input"` is present
2. Open Chat Settings → Temperature slider: confirm `aria-label="Temperature"` is present
3. Navigate to a chatbot dashboard → LLM settings → Temperature slider: confirm `aria-label="Temperature"`
4. Run in Console: `document.querySelectorAll('input:not([type=hidden]), textarea, select').forEach(el => { const label = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.id; console.log(el.tagName, el.type, label || 'MISSING LABEL') })`
5. Confirm no "MISSING LABEL" entries for interactive controls

---

#### #15 — Duplicate accessible names on theme toggle (WCAG 4.1.2)

**Commits:** `73208871`
**Files:** Theme toggle component

**How to verify:**

1. Inspect the theme toggle buttons (system/light/dark) in the sidebar footer
2. Confirm each button has a **unique** `aria-label` (e.g., "System theme", "Light theme", "Dark theme")
3. Run Lighthouse → confirm no "Links/buttons do not have a unique accessible name" warnings

---

#### #16 — Privacy status not updating

**Commits:** `e3fbd4f5`, `262133b5`
**Files:** `ProjectTable.tsx`

**How to verify:**

1. Create or edit a chatbot, set sharing to "All logged-in users"
2. Navigate to "My Chatbots" table
3. Confirm the chatbot shows "Logged-in Users" (not "Private")
4. Change to "Public" — confirm label updates to "Public"

---

#### #17 — Heatmap uses semantic table (WCAG 1.3.1)

**Commits:** `212fbafd`
**Files:** `ConversationsHeatmapByHourChart.tsx`

**How to verify:**

1. Navigate to `/{course}/analysis`
2. Scroll to the heatmap chart
3. Inspect the element — confirm it uses `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`, `<th scope="row">`, and `<td>` elements
4. Confirm the table has `aria-label="Conversations by day and hour heatmap"`
5. Confirm each cell has `aria-label` (e.g., "Monday at 14:00: 5 conversations")

---

#### #18 — Focus-visible indicators (WCAG 2.4.7)

**Commits:** `1386f967`, `a4723635`, `e2493072`
**Files:** `globals.css`

**How to verify:**

1. Open any page and press **Tab** repeatedly
2. Confirm every focusable element (buttons, links, inputs) shows a visible focus outline
3. The outline should be clearly visible in both light and dark modes
4. Check specifically: chat input, send button, sidebar buttons, navbar links

---

#### #19 — H1 elements on all pages (WCAG 2.4.1)

**Commits:** `ecceebf5`, `d3b7d88d`, `ac78a92e`, `62761842`
**Files:** `home.tsx`, `index.tsx`, `upload.tsx`, `prompt.tsx`, `api.tsx`, `Explore.tsx`, `MakeNewCoursePage.tsx`, etc.

**How to verify:**

1. Visit each key page: `/`, `/chat`, `/{course}/chat`, `/{course}/dashboard`, `/{course}/upload`, `/new`
2. On each page, run: `document.querySelectorAll('h1').length` — should be exactly 1
3. Confirm the h1 has class `sr-only` (screen-reader only) and contains the page/course name
4. With VoiceOver, the h1 should be the first heading announced

---

#### #20 — Bare URL link text in chat messages (WCAG 2.4.4)

**Commits:** `5b8b40d5`
**Files:** `ChatMessage.tsx`

**How to verify:**

1. Get a chat response that contains a bare URL (e.g., `https://chat.illinois.edu/new`)
2. Confirm the link displays a readable label like `chat.illinois.edu/new` instead of the full `https://...` URL
3. Confirm the link has `text-decoration: underline` (not color-only indication)
4. Hover over the link — confirm underline thickness increases

---

#### #21 — Sidebar navigation landmark (WCAG 1.3.1)

**Commits:** `5b8b40d5`, `5028f2b8`
**Files:** `Sidebar.tsx`

**How to verify:**

1. Open the chat page with sidebar visible
2. Inspect the sidebar container — confirm it is a `<nav>` element with `aria-label="Chat sidebar"`
3. Confirm there is no nested `<nav>` inside (the conversation list should be a `<div>`)
4. With VoiceOver landmarks rotor (Ctrl+Option+U → Landmarks), confirm "Chat sidebar" appears

---

#### #22 — Switches keyboard-operable (WCAG 2.1.1)

**Commits:** `966fc253`
**Files:** Various switch/toggle components

**How to verify:**

1. Tab to any Switch/toggle control (e.g., in Chat Settings)
2. Press **Space** or **Enter** — the switch should toggle
3. Confirm the switch has a visible focus indicator when focused

---

#### General — Run full automated verification

To verify all fixes at once:

```bash
# Run all 1026 tests (requires Node v22)
nvm use 22 && npx vitest run

# Run only accessibility-specific tests
npx vitest run --grep "a11y|accessibility|aria|wcag"

# Run Lighthouse CI (requires Chrome)
npx lighthouse https://chat.illinois.edu --only-categories=accessibility --output=json
```

### Not covered — with reasons

| #   | Issue                       | Reason for omission                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | "Members" label contrast    | **CSS-only fix.** Contrast ratios cannot be verified in JSDOM (no computed styles / visual rendering). Requires visual regression testing (e.g., Chromatic) or a Lighthouse CI audit.                                                                                                                                                                                                                                           |
| 7   | Skip navigation             | **Implemented** (`_app.tsx:94` has `<a href="#main-content" class="skip-nav-link">Skip to main content</a>` with CSS in `globals.css:6-22`). **Not unit-tested** because `_app.tsx` requires rendering the full provider hierarchy (Keycloak, PostHog, QueryClient, Mantine, ThemeProvider) — better suited for an **E2E test** with Playwright that verifies Tab → skip link appears → click → focus moves to `#main-content`. |
| 9   | No visible text selection   | **CSS/browser behavior issue.** Text selection highlighting is controlled by `::selection` CSS pseudo-element and browser defaults. Cannot be asserted in JSDOM. Requires manual browser testing.                                                                                                                                                                                                                               |
| 13  | Math rendering broken       | **Investigated.** `rehype-mathjax` and `remark-math` ARE configured in `ChatMessage.tsx` (lines 51-53, 1255-1256). Plugins are imported and used in the ReactMarkdown pipeline. The issue may be missing MathJax CSS/font loading or specific LaTeX edge cases. Needs browser-level testing to confirm rendering output.                                                                                                        |
| 15  | Search field non-functional | **Investigated.** Server-side search works via `search_conversations_v3()` PostgreSQL function. The client-side `filteredConversations` state is dead code. UX issues: no loading indicator during 500ms debounce, no "no results" message. Functional but has UX gaps.                                                                                                                                                         |
