#!/bin/bash

# Parse command line parameters, if any
HELP=false
FORCE=false
while [[ $# -gt 0 ]]
do
  if [[ "$1" == "-h" || "$1" == "--help" ]]
  then
    HELP=true
  elif [[ "$1" == "-f" || "$1" == "--force" ]]
  then
    FORCE=true
  fi
  shift
done

# Execute. If help is requested, don't actually execute the script.
if [[ "$HELP" == true ]]
then
  echo "Apply dummy environment variables to aries-key-guardian"
  echo ""
  echo "USAGE:  useDummyEnv.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "-h, --help     Display this help message"
  echo "-f, --force    Force execute the useDummyEnv.sh script without checking the current working directory"
elif [[ "$FORCE" == true || "$PWD" == */aries-key-guardian ]]
then
  cp dummy.env .env
  echo "Success"
  exit 0
else
  echo "This script must be run from the top-level aries-key-guardian directory. You are currently running it from: $PWD"
  exit 1
fi
