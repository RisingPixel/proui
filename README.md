# ProUI for Construct 3

Open-source distribution of **Aekiro ProUI** for Construct 3 (SDK v2).

ProUI is a UI toolkit packaged as Construct add-ons (plugins + behaviors) to build interface systems such as buttons, dialogs, scroll views, sliders, progress widgets, translations, and data-driven grids.

## Repository layout

- `source/` — individual add-ons, one folder per component (each contains `addon.json`, editor-time scripts, and `c3runtime/` runtime files).
- `dist-collection/` — packaged release archives (`ProUI_vX.XXX.zip`).
- `doc/` — project documentation/demo assets.
- `tools/release.zsh` — helper script to build `.c3addon` bundles and aggregate a versioned release zip.

## Developer Docs

- Canonical technical guide: [`doc/developer-guide.md`](doc/developer-guide.md)

Contributor note: if you plan to modify runtime behavior code (especially under `source/*/c3runtime/`), read `doc/developer-guide.md` first.

## Add-ons included

Core:
- `aekiro_proui` (required base plugin)

UI components/behaviors:
- `aekiro_button`
- `aekiro_checkbox`
- `aekiro_dialog`
- `aekiro_scrollView`
- `aekiro_sliderbar`
- `aekiro_progress`
- `aekiro_discreteProgress`
- `aekiro_discreteProgressPart`
- `aekiro_radiobutton`
- `aekiro_radiogroup`
- `aekiro_gridView`
- `aekiro_gridViewBind`
- `aekiro_gameObject`
- `aekiro_translation`
- `aekiro_translationB`
- `aekiro_remoteSprite`
- `aekiro_remoteSprite_dom`

Most add-ons are currently versioned at `2.0.0.0` in `source/*/addon.json`.

## Documentation

- [Add-on anatomy guide (`aekiro_button` walkthrough)](doc/addon-anatomy.md)
- [ProUI User Documentation](doc/ProUI_User_Documentation.md)

## Requirements

- Construct 3 with SDK v2 add-on support.
- For projects using ProUI behaviors, include the `ProUI` plugin (`aekiro_proui`) in the project.

## Using a release package

1. Download a release archive from `dist-collection/` or the GitHub Releases page.
2. Extract the archive.
3. In Construct 3, import the required `.c3addon` files.
4. Add `ProUI` to your project before using dependent behaviors.

## Building a new release locally

The repository includes `tools/release.zsh` to package all add-ons and create a versioned collection zip.

From the repo root:

```bash
./tools/release.zsh <version>
```

Example:

```bash
./tools/release.zsh 2.001
```

What the script does:
1. Recreates `build/`.
2. Zips each directory under `source/` into an individual `.c3addon` file.
3. Creates `ProUI_v<version>.zip` from those artifacts.
4. Moves the final zip to `dist-collection/`.

## Version update checklist

Before running a release, keep metadata aligned:

- Update version fields in relevant `source/*/addon.json` files.
- Confirm release naming format `ProUI_vX.XXX.zip`.
- Verify the generated archive appears in `dist-collection/`.

## Developer Docs

- [Runtime architecture](doc/architecture.md)

## Contributing

Contributions are welcome, especially compatibility fixes for newer Construct 3 versions.

For packaging/versioning guidance, see [Release process](doc/release-process.md).

If you open a PR:
- Keep changes scoped to the relevant add-on(s).
- Mention runtime/editor impact.
- Include migration notes when behavior changes are user-visible.

## Community support

Support Construct ecosystem maintenance via:

- [Construct Community Fund](http://opencollective.com/construct-community/contribute)

## Latest release

- [2.000](https://github.com/RisingPixel/proui/releases/download/v2.0.0/ProUI_v2.000.zip) — Migration to SDK 2.
