# GitHub Action Artifact Bundle

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action to create a archive in Apple
[Artifact bundle](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0305-swiftpm-binary-target-improvements.md#artifact-bundle)
format. It's is useful for distributing binaries built from Swift Package for
Package Plugin or using [nest](https://github.com/mtj0928/nest).

## Features

- [x] Create Artifact Bundle from Swift Package
- [x] Auto checksum calculation
- [x] Support for multiple architectures
- [x] Support for Linux binary
- [ ] Support for package resources

## Usage

This plugin collect executables from the repository and compress them into
`*.artifactbundle.zip`. This plugin just make a bundle, so you need to set up
the steps to build Swift Package before this plugin.

```yaml
on:
  release:
    types: [published]
name: Upload Artifact Bundle to Release
env:
  DEVELOPER_DIR: '/Applications/Xcode_16.3.app/Contents/Developer'
jobs:
  release:
    name: Build and Upload Artifact Bundle
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - name: Build for arm64
        run: swift build --disable-sandbox -c release --arch arm62
      - name: Build for x86_64
        run: swift build --disable-sandbox -c release --arch x86_64
      - uses: giginet/github-action-artifactbundle@v1
        with:
          artifact_name: myexecutable
      - name: Upload Artifact Bundle to Release
        run: |
          BODY=${{ github.event.release.body }}
          gh release upload ${{ jobs.release.outputs.bundle_filename }} ${{ jobs.release.outputs.bundle_path }}
          NEW_BODY=$(cat $BODY '\n' ${{ jobs.release.output.bundle_sha256 }})
          gh release update ${{ github.event.release.tag_name }} --body "$NEW_BODY"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Required | Key             | Description                       | Default Value                                                 |
| -------- | --------------- | --------------------------------- | ------------------------------------------------------------- |
| ✅       | `artifact_name` | Name of the executable to collect |                                                               |
|          | `version`       | Version of the artifact           | `${{ github.event.release.tag_name \| ${{ github.ref_name }}` |
|          | `package_path`  | Path to the package directory     | ./                                                            |

### Action Outputs

| Key               | Description                         | Value                                      |
| ----------------- | ----------------------------------- | ------------------------------------------ |
| `bundle_path`     | Pass to the created artifact bundle | .artifacts/myexecutable.artifactbundle.zip |
| `bundle_sha256`   | SHA256 hash of the bundle           | 6ac5405041deec86c371ce71e5f7e56b0c7122f4   |
| `bundle_filename` | Filename of the bundle              | myexecutable.artifactbundle.zip            |

## Build Linux Binary

The Swift compiler supports cross-compilation. If you want to make a Linux
binary, you can refer the following steps.

```yaml
jobs:
  release:
    steps:
      - name: Install Linux SDK
        run:
          swift sdk install
          https://download.swift.org/swift-6.0.3-release/static-sdk/swift-6.0.3-RELEASE/swift-6.0.3-RELEASE_static-linux-0.0.1.artifactbundle.tar.gz
      - name: 'Build for Linux(x86_64)'
        run: swift build --swift-sdk x86_64-swift-linux-musl
      - name: 'Build for Linux(arm64)'
        run: swift build --swift-sdk aarch64-swift-linux-musl
```

See details for
[Swift.org - Getting Started with the Static Linux SDK](https://www.swift.org/documentation/articles/static-linux-getting-started.html).

This action automatically gather the executables for each architecture and
they'll be included to a bundle.

## License

MIT License
