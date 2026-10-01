// The React 18 unit run (Vitest project `unit-react18`) loads `react-dom-18`, an alias of
// react-dom@18.3.1. pnpm would satisfy its `react` peer with the root React 19, so react-dom 18
// would render with React 19. Give it React 18 as a regular dependency instead.
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'react-dom' && pkg.version === '18.3.1') {
        delete pkg.peerDependencies.react;
        pkg.dependencies = { ...pkg.dependencies, react: '18.3.1' };
      }
      return pkg;
    },
  },
};
