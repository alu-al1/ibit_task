#!/bin/bash

set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm use

set -x

##  egrep -rn "export const.*=\s?envAs"
## TODO check if find in vars.mjs wc -l == egrep | wc -l

export VERBOSE=0
export DEBUG=0

export EMCONT_URL="https://rates.emcont.com/"
export EMCONT_POLL_INTERVAL_MS=1000
export WS_PORT=8080
export HISTORY_DEPTH_MINUTES=30
export SQLITE3_ASSETS_DB="assets/assets.db"

## sqlite3 -line assets/assets.db 'select count(*) from rates'
## TODO npm run service
node main.mjs