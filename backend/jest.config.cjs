module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json', diagnostics: { ignoreCodes: [151002] } }] },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
