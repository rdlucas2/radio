#!/bin/sh

test -z "${1}" && echo $(date)
#test x"${1}" = "xartist" && echo "Great Artist"
#test x"${1}" = "xtitle" && echo "Great Song"
songpath=$(cat currentSong.txt)
echo $(cat $songPath)
