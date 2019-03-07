#!/bin/sh

set -ex

IDEN3JSPATH="${HOME}/git/iden3/iden3js"

pushd "${IDEN3JSPATH}"
npm run browserify
popd
cp "${IDEN3JSPATH}/iden3js-bundle.js" js/
