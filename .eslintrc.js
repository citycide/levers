module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    node: true,
    mocha: true
  },
  extends: 'standard',
  plugins: [],
  rules: {
    quotes: ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
  }
}
