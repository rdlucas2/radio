#!/bin/bash

find /media -name \*\.mp3 | sort -R | tail --lines 1
