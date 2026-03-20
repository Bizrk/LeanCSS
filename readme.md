# LeanCSS

**Define sets. Lift them into components. Ship lean CSS.**

LeanCSS is a CSS-first utility composition tool.

It lets you define reusable style bundles with `@set` (or `@drop`), then expand them inside selectors using `@lift`.

Unlike utility-class frameworks, LeanCSS keeps styling in CSS instead of HTML while still enabling composable, reusable patterns.

LeanCSS runs at build time and outputs plain CSS.

* * *

# Why LeanCSS?

Modern CSS tooling tends to fall into two camps.

### Utility frameworks

Example:

&lt;button class="inline-flex items-center gap-2 px-4 py-2 rounded-md"&gt;

What is this?

Pros

- fast to prototype
    
- composable
    

Cons

- styles move into markup
    
- semantics become unclear
    
- component styles become fragmented
    

* * *

### Sass mixins

Example:

.button {  
@include flex-center;  
}

Pros

- reusable abstractions

Cons

- hidden logic
    
- hard to inspect
    
- often grows into a mini programming language
    

* * *

### LeanCSS approach

LeanCSS keeps composition **inside CSS itself**.

Example:

@set inline-flex {  
display: inline-flex;  
}  
<br/>@set items-center {  
align-items: center;  
}  
<br/>@set gap-2 {  
gap: var(--space-2);  
}  
<br/>.button {  
@lift inline-flex items-center gap-2;  
}

Output:

.button {  
display: inline-flex;  
align-items: center;  
gap: var(--space-2);  
}

* * *

# Features

LeanCSS is intentionally simple.

• CSS-first authoring  
• reusable style bundles via `@set` and `@drop`  
• composition via `@lift`  
• alias sets  
• cascade layer friendly  
• works with `.css` and `.scss`  
• outputs plain CSS  
• zero runtime

* * *

# Installation

npm install @bizrk/leancss

Add LeanCSS to your PostCSS configuration.

Example (`postcss.config.mjs`):

```javascript
import leancss from "@bizrk/leancss"  

export default {  
  plugins: [  
    leancss()  
  ]  
}
```

*Note: LeanCSS exports both CommonJS and ECMAScript modules out-of-the-box. If your modern framework (like Vite) enforces `"type": "module"`, you can safely use `postcss.config.js` or `postcss.config.mjs` using `import`. If using CommonJS, use `postcss.config.cjs` and `require("@bizrk/leancss")`.*

LeanCSS runs during the CSS build process.

* * *

# Editor Support (VS Code)

To prevent VS Code from reporting "Unknown at-rule" warnings for `@set` and `@lift`, you can configure custom CSS data.

Create `.vscode/leancss.css-data.json`:

```json
{
  "version": 1.1,
  "atDirectives": [
    {
      "name": "@set",
      "description": "LeanCSS: Defines a reusable declaration bundle or alias bundle."
    },
    {
      "name": "@drop",
      "description": "LeanCSS: Like @set, but additionally generates a CSS class of the same name."
    },
    {
      "name": "@lift",
      "description": "LeanCSS: Expands one or more sets into the current selector rule."
    }
  ]
}
```

Then tell VS Code to use it in `.vscode/settings.json`:

```json
{
  "css.customData": ["./.vscode/leancss.css-data.json"],
  "scss.customData": ["./.vscode/leancss.css-data.json"]
}
```

* * *

# Basic Usage

Define reusable sets.

@set inline-flex {  
display: inline-flex;  
}  
<br/>@set items-center {  
align-items: center;  
}  
<br/>@set gap-2 {  
gap: var(--space-2);  
}

Use them in selectors.

.button {  
@lift inline-flex items-center gap-2;  
}

LeanCSS expands the sets during compilation.

* * *

# Drop utility groups

Sometimes you want a defined set to *also* be available as a regular CSS class without having to manually map it. You can use `@drop` instead of `@set`.

@drop container {
  max-width: 1200px;
}

This does two things:
1. It registers `container` so it can be used with `@lift container`.
2. It outputs a `.container { max-width: 1200px; }` class directly in your CSS.

* * *

# CLI Tools

LeanCSS is reversible and comes with maintenance tools to keep your project clean. 

You can run these commands via `npx leancss <command>`:

### Trim
Keep the registry lean with `trim`, which removes unused patterns and optionally flattens weak ones.

```bash
# Preview what would be removed
npx leancss trim

# Actually remove unused patterns
npx leancss trim --write

# Automatically flatten patterns only used 1 time into their parent selector
npx leancss trim --write --single-use
```

### Deload
If a project is finished, handed off, or simply no longer needs the abstraction layer, you can deload back to plain CSS at any time.

This flattens LeanCSS back into standard CSS.

```bash
# Preview what would be flattened
npx leancss deload

# Flatten every @lift into plain CSS
npx leancss deload --write

# Flatten every @lift AND remove the original @set declarations entirely
npx leancss deload --write --clean
```

* * *

# Alias Sets

Sets can compose other sets.

Example:

@set flex-center {  
@lift inline-flex items-center justify-center;  
}

Usage:

.icon {  
@lift flex-center;  
}

Output:

.icon {  
display: inline-flex;  
align-items: center;  
justify-content: center;  
}

* * *

# Cascade Layers

LeanCSS works well with CSS cascade layers.

Example:

@layer reset, tokens, base, utilities, components, overrides;

Define sets in a utilities layer:

@layer utilities {  
@set inline-flex {  
display: inline-flex;  
}  
<br/>@set items-center {  
align-items: center;  
}  
}

Consume them in components:

@layer components {  
.button {  
@lift inline-flex items-center;  
}  
}

LeanCSS preserves layer ordering.

* * *

# Example Project Structure

src/styles  
├─ tokens.css  
├─ utilities.css  
├─ base.css  
├─ components  
│ ├─ button.css  
│ ├─ card.css  
│ └─ hero.css  
└─ app.css

Example utilities file:

```css
@layer utilities {  
  @set inline-flex {  
    display: inline-flex;  
  }  

  @set items-center {  
    align-items: center;  
  }  

  @set gap-2 {  
    gap: var(--space-2);  
  }  

  @set rounded-md {  
    border-radius: var(--radius-md);  
  }  
}
```

Example component:

```css
.button {  
  @lift inline-flex items-center gap-2 rounded-md;  
}
```

### Running PostCSS

You can use the `postcss-cli` package to compile your CSS. Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:css": "postcss src/styles/app.css -o dist/output.css",
    "watch:css": "postcss src/styles/app.css -o dist/output.css --watch"
  }
}
```

Run `npm run build:css` to build your styles once for production, or `npm run watch:css` while actively developing to automatically re-compile whenever you save your CSS files.

* * *

# Philosophy

LeanCSS focuses on small, composable primitives.

It encourages:

• semantic selectors  
• design token usage  
• cascade layers  
• small reusable patterns

It intentionally avoids:

• HTML class scanning  
• runtime styling engines  
• heavy configuration files

LeanCSS is designed to remain small, predictable, and easy to reason about.

* * *

# Error Handling

LeanCSS validates styles during compilation.

### Unknown set

.button {  
@lift missing-set;  
}

Error:

Unknown LeanCSS set: missing-set

* * *

### Duplicate set

@set panel { ... }  
@set panel

Error:

Duplicate LeanCSS set definition: panel

* * *

### Circular reference

@set a { @lift b }  
@set b

Error:

Circular set reference detected

* * *

# Comparison

| Tool | Composition Location |
| --- | --- |
| Tailwind | HTML |
| Sass mixins | Sass |
| LeanCSS | CSS |

LeanCSS combines composability with semantic CSS architecture.

* * *

# License

LeanCSS is released under the MIT License.

* * *

# Contributing

Contributions are welcome.

Areas that benefit from community help:

• integrations  
• preset libraries  
• documentation  
• testing

* * *

# Future Ideas

LeanCSS v1 focuses on a minimal core.

Possible future additions include:

• preset utility libraries  
• devtools for inspecting `@lift` expansion  
• design system integrations

* * *

# LeanCSS

**Define sets. Lift them into components.**