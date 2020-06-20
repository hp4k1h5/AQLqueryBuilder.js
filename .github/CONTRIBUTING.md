# contributing
[toc]

thanks for using AQLqueryBuilder.js. all contributions are welcome. whether or
not you are considering [contributing code](#code-contributions), please file
an issue. templates are not required.

please try to be respectful of other members of the community and yourself.

## Templates

### features

please file a [feature
request](https://github.com/HP4k1h5/AQLqueryBuilder.js/issues/new?assignees=&labels=&template=feature_request.md&title=)

### bugs

im sorry. please file a [bug report](https://github.com/HP4k1h5/AQLqueryBuilder/issues/new?assignees=HP4k1h5&labels=bug&template=bug_report.md&title=basic)

## code contributions

When contributing code, please:
1) file an issue and describe the bugfix or feature
2) fork this repository
3) checkout the latest version branch, which will be in the `v.X.X.X` format,
and should be the only version branch available. Don't hesitate to ask if it
is unclear.
4) make changes
5) add tests; using mochai/chai
  run tests with e.g. `yarn test tests/glob`  
  or  
  `yarn tests` to run the suite
  see [testing](#testing) for more information.
6) add comments, and if possible, in the
[typedoc](https://github.com/TypeStrong/typedoc) style
7) submit a merge request from your forked branch into the
latest HP4k1h5/AQLqueryBuilder `v.X.X.X` branch.


### testing

all tests that require a live arango instance are run with root:"" no
permissions on `localhost:8529`. This can be modified in test files that
require db access.
