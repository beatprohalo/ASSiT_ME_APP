#!/bin/bash

# Start the app with increased memory allocation and garbage collection
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"
npm start
