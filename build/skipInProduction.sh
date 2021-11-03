#!/bin/bash

shopt -s nocasematch

if [[ -n $NODE_ENV || $NODE_ENV -eq "" ]]
then
    echo "Unknown environment. Assuming development environment: Executing next task."
    exit 1;
fi

if [[ $NODE_ENV -ne "production" && $NODE_ENV -ne "PRODUCTION" ]]
then
    echo "Detected development environment: Executing next task."
    exit 1;
fi

echo "Detected production environment: Skipping next task."
exit 0;
