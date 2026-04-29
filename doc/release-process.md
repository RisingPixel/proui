# Release process

This guide defines how to prepare and validate a ProUI release package.

## 1) Use `tools/release.zsh`

From the repository root, run:

```bash
./tools/release.zsh <version>
```

Example:

```bash
./tools/release.zsh 2.001
```

### What the script does

`tools/release.zsh` performs these steps:

1. Removes any existing `build/` directory.
2. Recreates `build/`.
3. Iterates every folder in `source/` and zips each add-on into a `.c3addon` archive in `build/`.
4. Creates a combined release archive named `ProUI_v<version>.zip` from everything in `build/`.
5. Moves that release zip to `dist-collection/`.

### Expected output artifacts

After a successful run you should have:

- One `.c3addon` per add-on in `build/` (for example `build/aekiro_proui.c3addon`).
- A release zip in `dist-collection/` named exactly `ProUI_vX.XXX.zip` (for example `dist-collection/ProUI_v2.001.zip`).

## 2) Version policy

Version consistency is required for every release.

### When to update `source/*/addon.json` version

Update `version` fields **before** running `tools/release.zsh` whenever you are publishing a new release.

### How to update `source/*/addon.json` version

- Set the same version value in every released add-on's `addon.json` `version` field.
- Do not publish a release zip containing mixed add-on versions.
- Keep the `tools/release.zsh` input version (`X.XXX`) aligned with the release number in `dist-collection/ProUI_vX.XXX.zip`.

## 3) Metadata quality checklist

Before release, verify each `source/*/addon.json` has non-placeholder metadata:

- `website` is a real project/product URL (not placeholder text such as `https://later.com`, `https://example.com`, or empty values).
- `documentation` points to real docs.
- `help-url` (when present for that add-on type) points to a real support/help page.

## 4) Pre-release validations (static checks only)

Do these validations locally before publishing. Runtime tests are not required by this checklist.

1. **All add-ons have a consistent version.**
2. **All `file-list` entries exist** relative to each add-on directory.
3. **Release zip naming** follows `ProUI_vX.XXX.zip`.

### Optional command snippets

Check version consistency:

```bash
python - <<'PY'
import glob, json
versions = {}
for path in glob.glob('source/*/addon.json'):
    with open(path, 'r', encoding='utf-8') as f:
        versions[path] = json.load(f).get('version')
unique = sorted(set(versions.values()))
print('unique versions:', unique)
if len(unique) != 1:
    for p, v in sorted(versions.items()):
        print(f'{p}: {v}')
    raise SystemExit(1)
PY
```

Check `file-list` entries exist:

```bash
python - <<'PY'
import glob, json, os
errors = []
for path in glob.glob('source/*/addon.json'):
    base = os.path.dirname(path)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for rel in data.get('file-list', []):
        full = os.path.join(base, rel)
        if not os.path.exists(full):
            errors.append(f'{path}: missing {rel}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print('all file-list entries exist')
PY
```

Check release archive naming:

```bash
ls dist-collection/ProUI_v*.zip
```

Ensure any newly produced artifact still matches `ProUI_vX.XXX.zip`.
