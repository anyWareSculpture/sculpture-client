module.exports = {
  "extends": "eslint:recommended",

  // http://eslint.org/docs/user-guide/configuring
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true
    }
  },

  "env": {
    "es6": true, // enable all ECMAScript 6 features except for modules.
    "shared-node-browser": true,
  },

  "plugins": [
    "babel"
  ],

  // http://eslint.org/docs/rules/
  "rules": {

    // Possible errors
    "comma-dangle": ["error", "only-multiline"],
    "eqeqeq": ["error", "smart"],

    // Best practices
    "no-alert": "error",
    "no-unused-vars": "warn",
    "no-console": "warn",

    // ES2015
    "no-var": "error",
    "arrow-parens": "error",
    "radix": ["error", "as-needed"],

    // Style
    "indent": ["error", 2],
    "semi": ["error", "always"],
    "curly": ["error", "multi-line"],
    "brace-style": ["error", "stroustrup"],


    // Overrides from airbnb
    "quotes": "off",
    "max-len": "off",
    "no-underscore-dangle": "off",
    "no-unneeded-ternary": "off",

    // FIXME: Add
    // "space-infix-ops"
    // "object-shorthand"

    // FIXME: These should be made errors:
    "no-param-reassign": "warn",

    // FIXME: Consider enforcing these:
    "object-curly-spacing": "off",
    "object-shorthand": "off",
  }
};
