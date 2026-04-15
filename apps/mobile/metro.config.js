const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Void Count is an npm-workspaces monorepo. Metro defaults to walking up from
// the app root, so we have to (1) tell it about the workspace root as a
// watched folder, and (2) pin node_modules resolution to the app + root so
// hoisted packages like @void-count/core resolve correctly.
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
