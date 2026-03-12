# LeanCSS

**Define sets. Lift them into components. Ship lean CSS.**

LeanCSS is a CSS-first utility composition tool.

It lets you define reusable style bundles with `@set`, then expand them inside selectors using `@lift`.

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
• reusable style bundles via `@set`  
• composition via `@lift`  
• alias sets  
• cascade layer friendly  
• works with `.css` and `.scss`  
• outputs plain CSS  
• zero runtime

* * *

# Installation

npm install @leancss/postcss

Add LeanCSS to your PostCSS configuration.

Example:

import leancss from "@leancss/postcss"  
<br/>export default {  
plugins: \[  
leancss()  
\]  
}

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

@layer utilities {  
<br/>@set inline-flex {  
display: inline-flex;  
}  
<br/>@set items-center {  
align-items: center;  
}  
<br/>@set gap-2 {  
gap: var(--space-2);  
}  
<br/>@set rounded-md {  
border-radius: var(--radius-md);  
}  
<br/>}

Example component:

.button {  
@lift inline-flex items-center gap-2 rounded-md;  
}

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