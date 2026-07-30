#!/bin/bash

if command -v grunt
then
    grunt $1;
    exit $?;
fi

echo "Grunt not found. Exiting.";
exit 0;
