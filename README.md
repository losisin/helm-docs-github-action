# Helm Docs GitHub Action

[![CI](https://github.com/losisin/helm-docs-github-action/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/losisin/helm-docs-github-action/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/losisin/helm-docs-github-action/graph/badge.svg?token=0QQVCFJH84)](https://codecov.io/gh/losisin/helm-docs-github-action)
[![Static Badge](https://img.shields.io/badge/licence%20-%20MIT-green)](https://github.com/losisin/helm-docs-github-action/blob/main/LICENSE)
[![GitHub release (with filter)](https://img.shields.io/github/v/release/losisin/helm-docs-github-action)](https://github.com/losisin/helm-docs-github-action/releases)

Install [helm-docs](https://github.com/norwoodj/helm-docs) tool and auto-generate Markdown documentation from Helm charts. It always uses latest version of `helm-docs`.

## Usage

To use this action, add the following step to your workflow:

```yaml
name: Generate Helm documentation
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: ${{ github.event.pull_request.head.repo.full_name }}
          ref: ${{ github.event.pull_request.head.ref }}
      - name: Run helm-docs
        uses: losisin/helm-docs-github-action@v1
```

> [!NOTE]
> This will only generate Markdown documentation but no further action will be taken.

## Inputs

| Name | Description | Default | Required |
|------|-------------|---------|----------|
| `chart-search-root` | The root directory to search recursively within for charts | `.` | false |
| `values-file` | Path to values file | `values.yaml` | false |
| `output-file` | Markdown file path relative to each chart directory to which rendered documentation will be written | `README.md` | false |
| `template-files` | Comma separated list of template files to render | `README.md.gotmpl` | false |
| `sort-order` | Order in which to sort the values table | unset | false |
| `git-push` | If true it will commit and push the changes (ignored if `fail-on-diff` is set) | `false` | false |
| `git-push-user-name` | If empty the name of the GitHub Actions bot will be used | `github-actions[bot]` | false |
| `git-push-user-email` | If empty the no-reply email of the GitHub Actions bot will be used | `github-actions[bot]@users.noreply.github.com` | false |
| `git-commit-message` | Commit message | `update Helm documentation` | false |
| `fail-on-diff` | Fail the job if there is any diff found between the generated output and existing file | `false` | false |

## Outputs

| Name | Description |
|------|-------------|
| `plugin-path` | Path to the cached helm-docs binary |

## Examples

### Fail on diff

To fail the workflow if there is a diff between the generated documentation and the committed one, add the following step to your workflow:

```yaml
name: Generate Helm documentation
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: ${{ github.event.pull_request.head.repo.full_name }}
          ref: ${{ github.event.pull_request.head.ref }}
      - name: Run helm-docs
        uses: losisin/helm-docs-github-action@v1
        with:
          fail-on-diff: true
```


### Auto commit generated documentation

> [!NOTE]
> For pull requests from a forked repo to the base repo,
> `git-push` will fail to push to the forked repo,
> unless you pass `Personal access tokens` of the forked repo owners
> to the base repo and map them to `head.repo`.
> Consider using `fail-on-diff: true` in this case.

> [!NOTE]
> The `git-push` option is ignored if `fail-on-diff: true`.

To automatically commit the generated documentation, add the following step to your workflow:

```yaml
name: Generate Helm documentation
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: ${{ github.event.pull_request.head.repo.full_name }}
          ref: ${{ github.event.pull_request.head.ref }}
      - name: Run helm-docs
        uses: losisin/helm-docs-github-action@v1
        with:
          git-push: true
```

To overwrite default user and email which is set to `github-actions[bot]` and add custom commit message, add the following:

```yaml
name: Generate Helm documentation
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: ${{ github.event.pull_request.head.repo.full_name }}
          ref: ${{ github.event.pull_request.head.ref }}
      - name: Run helm-docs
        uses: losisin/helm-docs-github-action@v1
        with:
          input: values.yaml
          git-push: true
          git-push-user-name: "John Doe"
          git-push-user-email: "john.doe@example.com"
          git-commit-message: "chore: update Helm documentation"
```

## Issues, Features, Feedback

Your input matters. Feel free to open [issues](https://github.com/losisin/helm-docs-github-action/issues) for bugs, feature requests, or any feedback you may have. Check if a similar issue exists before creating a new one, and please use clear titles and explanations to help understand your point better. Your thoughts help me improve this project!

### How to Contribute

🌟 Thank you for considering contributing to my project! Your efforts are incredibly valuable. To get started:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -am 'Add: YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request! 🚀
