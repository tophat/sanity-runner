# sanity

A distributed sanity test runner.

### Usage

**TODO: write this**

### Examples

[Example with Webpack](examples/precompiling/README.md) - for how to use Webpack to precompile your test suite (and why you may want to)

### Pinned Packages

**BEWARE UPGRADING THE PINNED PACKAGES**

`jest` is pinned, because we are using a sketchy internal API to get the name of the test in the `afterEach` block. This is impossible otherwise, and necessary to take screenshots of failed tests. When upgrading `jest`, make sure you're still able to get screenshots of failed tests. 

`puppeteer` is pinned, because it has to be compatible with the specific version of the Chrome binary. See the [Chrome Binaries](#chrome-binaries) section for more info.

### Chrome Binaries

The Chrome binaries are specifically built for AWS Lambda. To build a new binary, see https://github.com/adieuadieu/serverless-chrome

A new binary may not simply work, and neither may upgrading Puppeteer. The versions of both are linked, and you must make sure they are compatible or tests may not be able to run.
