Ez stream media selector sh file:
/opt/radio/config/ezstream.sh

Be sure to run chmod +x on ezstream.sh

Put SOURCE password in ez stream config file:
/opt/radio/config/ezstream.xml

START EVERYTHING:
sudo docker-compose up -d

Stop:
docker-compose stop

BURN IT TO THE GROUD:
sudo docker-compose down -v

TODO:
- do ssl and 443?
- chatbot on site to grab any song from there?
- Landing page with player and info (right now it goes to ice cast landing page… how to change?
- find typescript source code for js files
