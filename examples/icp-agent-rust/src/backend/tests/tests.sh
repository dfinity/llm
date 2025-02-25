#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Run dfx stop if we run into errors.
trap "dfx stop" EXIT SIGINT

dfx start --background --clean

# Deploy canisters
dfx deploy agent-backend --no-wallet
dfx deps deploy ledger

# Call with test prompts in a loop
for prompt in \
    "explain to me what you do." \
    "convert tre5v-ziaaa-aaaal-qsivq-cai to an account id" \
    "Whats my balance?" \
    "Look up my balance: c5553c0e06a0a7f26c76d43f67052940a09548fef8f4082fec3fb3cbaddf1cc5" \
    "How is life?" \
    "Whats the speed of light?" \
    "Lookup my balance." \
    "da29b27beb16a842882149b5380ff3b20f701c33ca8fddbec" \
    ; do
  echo "==== Testing prompt: $prompt ===="
  ANSWER=$(dfx canister call agent-backend chat "(vec{record { 
    role = variant { user };
    content = \"$prompt\";
  }})");

  echo $ANSWER
  echo "==== End of test ===="
done
