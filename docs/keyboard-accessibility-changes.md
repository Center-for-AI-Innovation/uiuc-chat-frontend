# Keyboard Accessibility Changes

This document details every keyboard interaction improvement made in the `fix/accessibility-issues` branch, organized by category.

---

## 1. Global Focus Indicators (WCAG 2.4.7)

**Problem:** Keyboard users had no visible indication of which element was focused. Many components used `outline: none` or `focus:outline-none`, suppressing the browser's default focus ring.

**Solution:** A global `*:focus-visible` CSS rule with an orange outline, plus removal of outline-suppressing styles from individual components.

### Global rule (`globals.css`)

```css
*:focus-visible {
  outline: 2px solid var(--illinois-orange) !important;
  outline-offset: 2px !important;
}
*:focus:not(:focus-visible) {
  outline: none; /* suppress ring on mouse clicks */
}
```

### Components with outline suppression removed

| Component             | File                | What was removed                      |
| --------------------- | ------------------- | ------------------------------------- |
| Variable Modal inputs | `VariableModal.tsx` | `'&:focus': { outline: 'none' }`      |
| Chat rename input     | `Conversation.tsx`  | `focus:outline-none` Tailwind class   |
| Folder rename input   | `Folder.tsx`        | `focus:outline-none` Tailwind class   |
| Search input          | `Search.tsx`        | `focus:outline-none` Tailwind class   |
| API key input         | `Key.tsx`           | `focus:outline-none` Tailwind class   |
| Chat input            | `ChatInput.tsx`     | `focus:outline-none` Tailwind class   |
| Scroll-down button    | `ChatInput.tsx`     | Replaced with `focus-visible:outline` |

**Commits:** `e2493072`, `1386f967`, `a4723635`

### How to verify

1. Open any page, press **Tab** repeatedly
2. Every interactive element should show a 2px orange outline
3. Click with a mouse — no outline should appear (`:focus:not(:focus-visible)` suppresses it)

---

## 2. Keyboard Event Handlers (Enter / Space)

All custom interactive elements (divs acting as buttons) now respond to **Enter** and **Space** keys, matching the behavior of native `<button>` elements.

### Standard pattern used

```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleAction()
  }
}}
```

### Components updated

| Component              | File               | Key behavior                                                                          |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| Custom Switch/Toggle   | `CustomSwitch.tsx` | Replaced `onClick` with native `onChange` on checkbox — supports Enter/Space natively |
| File attachment cards  | `ChatMessage.tsx`  | Enter/Space opens the file (calls `onClick`)                                          |
| Prompt list items      | `PromptList.tsx`   | Enter/Space selects a prompt                                                          |
| Hamburger menu toggle  | `GlobalHeader.tsx` | Enter/Space toggles mobile menu, `aria-expanded` updates                              |
| Hamburger menu toggle  | `Navbar.tsx`       | Enter/Space toggles mobile menu, `aria-expanded` updates                              |
| Model selector items   | `ModelSelect.tsx`  | Enter/Space selects a model                                                           |
| Chatbot table rows     | `ProjectTable.tsx` | Enter/Space navigates to the chatbot                                                  |
| Admin dashboard button | `Sidebar.tsx`      | Enter/Space navigates to `/{course}/dashboard`                                        |

**Commits:** `966fc253`, `16c6eb56`, `888ceb83`, `5a08ccfa`, `cee56c57`, `065c9c2f`

### How to verify

1. Tab to any of the above elements
2. Press **Enter** or **Space** — the action should trigger
3. Confirm the element has `role="button"` (or equivalent) and `tabIndex={0}` in DevTools

---

## 3. Tab Order and Semantic Roles

### Elements added to tab order (`tabIndex={0}`)

| Element                  | File               | Role assigned | aria-label               |
| ------------------------ | ------------------ | ------------- | ------------------------ |
| Scrollable chat messages | `Chat.tsx`         | `region`      | `"Chat messages"`        |
| Conversation list        | `Sidebar.tsx`      | (container)   | `"Chat conversations"`   |
| Prompt list container    | `PromptList.tsx`   | `listbox`     | `"Available prompts"`    |
| Prompt list items        | `PromptList.tsx`   | `option`      | (text content)           |
| File attachment card     | `ChatMessage.tsx`  | `button`      | `"Open file {fileName}"` |
| Chatbot table rows       | `ProjectTable.tsx` | `button`      | (row content)            |

### Elements with `tabIndex={-1}` (programmatic focus only)

These elements can receive focus via JavaScript (e.g., skip-to-content, focus restoration) but are not in the sequential tab order:

| Element            | Files affected (16 total)                                                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<main>` landmarks | `Dashboard.tsx`, `Explore.tsx`, `home.tsx`, `index.tsx`, `upload.tsx`, `prompt.tsx`, `api.tsx`, `MakeNewCoursePage.tsx`, `MakeOldCoursePage.tsx`, `Maintenance.tsx`, `CannotViewCourse.tsx`, `CanViewOnlyCourse.tsx`, `CannotEditGPT4.tsx`, `PermissionGate.tsx`, `N8NPage.tsx`, `LLMsApiKeyInputForm.tsx` |

**Commits:** `60fc4836`, `888ceb83`, `16c6eb56`, `9022feea`

### How to verify

1. Press **Tab** through the chat page — confirm chat messages area and conversation list are focusable
2. In the prompt list, confirm only the selected item has `tabIndex={0}` (others have `-1`)
3. Run: `document.querySelectorAll('[tabindex="0"]').forEach(el => console.log(el.tagName, el.getAttribute('role'), el.getAttribute('aria-label')))`

---

## 4. Focus Management

### Skip-to-main-content

**File:** `_app.tsx`, `globals.css`

- An `<a href="#main-content">Skip to main content</a>` link is the first focusable element on every page
- Visually hidden at `top: -100%`; slides into view on `:focus` at `top: 0`
- All pages have a `<main id="main-content" tabIndex={-1}>` target
- On click/Enter, focus moves to `<main>` and the page scrolls to it

### Focus restoration on Sources panel close

**File:** `SourcesSidebar.tsx`

- Pressing **Escape** closes the Sources panel
- Focus returns to the element that opened it

### Focus on new conversation

**File:** `Sidebar.tsx`

- When creating a new conversation, focus programmatically moves to the chat textarea
- Uses `setTimeout` to wait for DOM update, then calls `chatInput.focus()`

### Scroll position management

**File:** `Chat.tsx`

- `userHasScrolled` state tracks whether the user has manually scrolled up
- Auto-scroll to bottom only fires when the user hasn't scrolled (prevents disorienting jumps)
- Resets on conversation switch so new conversations start at the bottom

**Commits:** `065c9c2f`, `9022feea`, `cfa69b47`

### How to verify

1. Press **Tab** once on any page — "Skip to main content" appears; press **Enter** — focus moves to main area
2. Open Sources panel, press **Escape** — panel closes and focus returns
3. Click "New Chat" in sidebar — focus should move to the chat textarea
4. In a long conversation, scroll up, then wait for a streaming response — the page should NOT auto-scroll you away from where you were reading

---

## 5. Button Visibility on Focus

**Problem:** Some buttons (edit, copy, thumbs up/down, regenerate) were only visible on mouse hover (`invisible group-hover:visible`), making them inaccessible to keyboard users.

**Solution:** Replaced `invisible`/`visible` with opacity-based transitions that respond to both hover and keyboard focus.

### Pattern used

```tsx
// Before (keyboard-inaccessible)
className="invisible group-hover:visible"

// After (keyboard-accessible)
className="opacity-0 transition-opacity duration-200
  hover:opacity-100
  focus-visible:opacity-100
  group-focus-within:opacity-100
  group-hover:opacity-100"
```

### Components updated

| Component            | File              | Buttons affected                       |
| -------------------- | ----------------- | -------------------------------------- |
| Chat message actions | `ChatMessage.tsx` | Copy, thumbs up/down, regenerate, edit |
| Chat message edit    | `ChatMessage.tsx` | Edit pencil icon                       |
| Code block buttons   | `CodeBlock.tsx`   | Copy code, download code               |

**Commits:** `7215578d`, `16c6eb56`, `cee56c57`

### How to verify

1. Tab to a chat message — action buttons (copy, thumbs, regenerate) should become visible
2. Tab to a code block — copy/download buttons should become visible
3. Move mouse away — buttons should remain visible while focused
4. Press **Tab** to leave the element — buttons should fade out

---

## 6. ARIA State Attributes

These attributes communicate keyboard-driven state changes to screen readers.

| Attribute       | Element           | File                 | Behavior                                           |
| --------------- | ----------------- | -------------------- | -------------------------------------------------- |
| `aria-expanded` | Hamburger menu    | `GlobalHeader.tsx`   | `true` when menu is open, `false` when closed      |
| `aria-expanded` | Hamburger menu    | `Navbar.tsx`         | `true` when menu is open, `false` when closed      |
| `aria-selected` | Prompt list items | `PromptList.tsx`     | `true` on the currently highlighted item           |
| `aria-pressed`  | Thumbs up/down    | `MessageActions.tsx` | Toggles when user activates the button             |
| `aria-label`    | File card         | `ChatMessage.tsx`    | `"Open file {fileName}"` for screen reader context |

**Commits:** `5a08ccfa`, `888ceb83`, `065c9c2f`

### How to verify

1. With VoiceOver (Cmd+F5 on macOS), tab to the hamburger menu — it should announce "collapsed" or "expanded"
2. In the prompt list, arrow through items — VoiceOver should announce "selected" for the active item
3. Press thumbs up — VoiceOver should announce "pressed"

---

## WCAG Success Criteria Addressed

| Criterion | Level | Title             | How addressed                                                       |
| --------- | ----- | ----------------- | ------------------------------------------------------------------- |
| 2.1.1     | A     | Keyboard          | All interactive elements operable via Enter/Space                   |
| 2.1.2     | A     | No Keyboard Trap  | Escape closes panels, focus restores, skip-nav available            |
| 2.4.1     | A     | Bypass Blocks     | Skip-to-main-content link on every page                             |
| 2.4.3     | A     | Focus Order       | Logical tab order, `tabIndex` management on dynamic elements        |
| 2.4.7     | AA    | Focus Visible     | Global orange outline on all focusable elements                     |
| 4.1.2     | A     | Name, Role, Value | `aria-expanded`, `aria-selected`, `aria-pressed`, `role` attributes |
