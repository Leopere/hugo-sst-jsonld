# Hugo SST JSON-LD

Generate a page-level JSON-LD `keywords` array from route-specific keywords in an SST YAML file.

This public repository is available for inspection. You need written permission from ColinKnapp.com before you install or use it. The instructions below are for authorized users.

The module supports two SST shapes:

- `localized_keywords.pages.<key>.<locale>.primary|secondary`
- `pages.<key>.keywords.primary|secondary` for English-only projects

## Requirements

- Hugo 0.143.0 or later
- Hugo Modules support, including Go 1.18 or later and Git
- A trusted local SST YAML file

## Install

Add the module to your Hugo configuration:

```toml
[[module.imports]]
path = "github.com/Leopere/hugo-sst-jsonld"
```

Then resolve the module:

```console
hugo mod get github.com/Leopere/hugo-sst-jsonld
```

## Use an SST file directly

Call the partial from your shared `<head>` template:

```go-html-template
{{ if not .Params.noindex }}
  {{ partial "sst-jsonld/from-file.html" (dict
    "page" .
    "source" "sst.yml"
    "key" (.Param "sstKey")
    "locale" (.Param "locale")
    "strict" true
  ) }}
{{ end }}
```

The source path is relative to the Hugo project root. Treat this file as trusted build input. Hugo's project security policy must allow `os.ReadFile` to read it.

Use `sstKey` when a stable content identifier is safer than a generated URL:

```yaml
---
title: Airport DNS
sstKey: /stories/airport-dns.html
---
```

Without `sstKey`, the module uses `.RelPermalink`. That value can change when you change `baseURL`, permalinks, output formats, or `uglyURLs`.

## Use parsed Hugo data

If your build already parses or generates SST data, pass the map directly:

```go-html-template
{{ partial "sst-jsonld/keywords.html" (dict
  "page" .
  "sst" .Site.Data.sst
  "key" (.Param "sstKey")
  "locale" .Language.Lang
  "strict" true
) }}
```

The module combines `primary` and `secondary` in authored order. It trims blank values and removes exact duplicates. The output uses a JSON array, not a comma-separated string.

## Options

- `page`: Required Hugo page object.
- `sst`: Required parsed SST map when you call `keywords.html`.
- `source`: SST YAML path for `from-file.html`. Defaults to `sst.yml`.
- `key`: SST page key. Defaults to `.RelPermalink`.
- `locale`: Locale code. Defaults to the page language.
- `language`: JSON-LD `inLanguage` value. Defaults to the selected locale code. Pass a full BCP 47 tag when you need one.
- `canonical`: JSON-LD URL. Defaults to `.Permalink`.
- `schemaType`: Schema.org type. Defaults to `WebPage`.
- `strict`: Fail the build for missing or empty keywords. Defaults to `true` in `keywords.html`.

Call the partial only on pages where you want structured data. For example, exclude redirects, error documents, and pages marked `noindex` in your base template.

## Test

```console
npm test
```

The integration fixture verifies localized and English SST shapes, strict mode, custom `.html` keys, subdirectory hosting, duplicate removal, and safe serialization of hostile text.

## Copyright and license

Copyright © 2026 ColinKnapp.com. All rights reserved.

This repository is public for viewing. No license is granted except as required by applicable law or the terms of the hosting platform. Contact ColinKnapp.com for written permission before you use, copy, modify, or distribute this work.
