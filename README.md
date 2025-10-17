# Snippet to Endpoint

**Snippet to Endpoint** is a Firefox extension that lets you capture either the **full page** or a **selected portion** of a web page, sanitize the HTML safely, preview it, and send it to your own **API endpoint**.  
I've primarily written it for my own use, to archive articles, job offers, code snippets etc.
---

## Features

- Capture **full page** or **user selection** as raw HTML.
- Automatically **sanitize** the HTML with [DOMPurify](https://github.com/cure53/DOMPurify).
- Preview the sanitized snippet in an isolated window before sending.
- Send the sanitized HTML to your custom API endpoint:
    - as **multipart/form-data**, or
    - as **JSON (base64-encoded)**.

---

## How It Works

1. **Popup →** User clicks “Capture Page” or “Capture Selection.”
2. **Background Script →** Instructs content script to extract HTML.
3. **Content Script →** Gathers HTML or selection.
4. **Background Script →** Sanitizes HTML with DOMPurify.
5. **Preview Window →** Displays sanitized HTML in an `<iframe>` for review.
6. **User →** Clicks “Send to Endpoint” to upload it to their configured API.

---


## Configuration

Open **Extension Options** (right-click the toolbar icon → “Manage Extension” → “Preferences”)
You can set:

| Option           | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| **API Endpoint** | The URL where the sanitized HTML should be sent.                     |
| **Auth Token**   | Optional Bearer token for authentication.                            |
| **Upload Mode**  | Choose between `multipart/form-data` and `application/json` uploads. |


---


## Permissions

This extension requests:

```json
"permissions": [
  "activeTab",
  "scripting",
  "storage"
]
```

---

## Licensing

This project is licensed under the **MIT License**.
It includes [DOMPurify](https://github.com/cure53/DOMPurify), which is dual-licensed under:

* **Apache License 2.0**, or
* **Mozilla Public License 2.0**

You may redistribute this project under MIT; the DOMPurify library remains under its original license.

---

## Example API Endpoint

Your endpoint should accept either:

* `multipart/form-data` with `sanitizedHtml`, `title`, and `url` fields
  **or**
* `application/json` with:

  ```json
  {
    "title": "Some Page",
    "url": "https://example.com",
    "sanitizedHtml": "BASE64_ENCODED_HTML"
  }
  ```

---

## Tested With

* **Firefox Developer Edition 130+**
* **Manifest V3**
* Works as temporary add-on and persistent add-on.
* Does not work under Chrome but with a little effort it should be made to work there as well
---


