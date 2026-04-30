export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^.*mail\\.service\\.js$': '<rootDir>/test/__mocks__/mail.service.js',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}
