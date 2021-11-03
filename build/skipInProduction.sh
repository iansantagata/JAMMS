#!/bin/bash

shopt -s nocasematch

if [[ -n $NODE_ENV || $NODE_ENV == "" || $NODE_ENV != "production" ]]
then
    echo "Detected development environment: Executing next task."
    exit 1;
fi

echo "Detected production environment: Skipping next task."
exit 0;
