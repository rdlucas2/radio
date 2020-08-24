#!/bin/bash

song=$(find /media -name \*\.mp3 | sort -R | tail --lines 1)
echo $song > currentSong.txt
sed -i 's/.mp3/.txt/g' currentSong.txt
echo $song
