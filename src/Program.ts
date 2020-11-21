import axios, { AxiosResponse } from 'axios';
import cheerio from 'cheerio';
import { TrackInfo } from './TrackInfo';
import fs from 'fs';
import pageNumber from './pageNumber.json';
import config from './config.json';

//scraping notes:
//class="tracksNumberCont" //Tracks: 1 – 10 of 1006
//href is artist-track-title.html - all spaces replaced with dashes
//class="downloadSingle" href="punch-deck-brazilian-street-fight.html" //TEXT: FREE DOWNLOAD  MP3 & WAV
//https://www.free-stock-music.com/music/punch-deck-brazilian-street-fight.mp3 //not every url maps to the mp3 nicely, if not downloadable through here just skip

export class Program {

    currentPageNum: number = pageNumber.currentPageNum;
    totalPages: number;
    maxTracksPerPage: number = 10;
    downloadPath: string = config.mediaPath;

    searchUrl = (pageNum: number): string => {
        return `https://www.free-stock-music.com/search.php?cat=&mood=&bpm=&length=&license=6&keyword=&p=${pageNum}`
    };

    getTotalPages = ($: CheerioStatic): number => {
        let totalTracks: number = parseInt($('.tracksNumberCont').text().split('of ')[1]);
        return Math.ceil(totalTracks / this.maxTracksPerPage);
    }

    getTrackLinksOnPage = ($: CheerioStatic): TrackInfo[] => {
        let tracks: TrackInfo[] = [];

        $('.downloadSingle').each((i: number, elem: CheerioElement) => {
            //console.log(elem);
            let trackPage = $(elem).attr('href');
            let simpleName: string = trackPage.replace('.html', '');
            let trackName: string = simpleName + '.mp3';
            let metaDataName: string = simpleName + '.txt';

            if (trackName.includes('http')) {
                return;
            }

            tracks.push({
                link: 'https://www.free-stock-music.com/music/' + trackName,
                path: this.downloadPath + trackName,
                metaDataLink: 'https://www.free-stock-music.com/' + trackPage,
                metaDataPath: this.downloadPath + metaDataName
            });
        });

        return tracks;
    }

    getMetaData = ($: CheerioStatic): string => {
        // console.log($('.front-label').first());
        // console.log($('.front-label').first().find('b').last().text());
        return $('.front-label').first().find('b').last().text();
    }

    downloadTrack = async (trackInfo: TrackInfo): Promise<void> => {
        const file: fs.WriteStream = fs.createWriteStream(trackInfo.path);
        return new Promise(async (resolve, reject) => {
            await axios.get(trackInfo.link, { responseType: 'stream' }).then(async (response: AxiosResponse) => {
                response.data.pipe(file);
                file.on('finish', resolve);
                file.on('error', reject);
            }).catch(error => {
                console.log(error);
            })
        });
    }

    downloadMetaData = async (trackInfo: TrackInfo): Promise<void> => {
        // const file: fs.WriteStream = fs.createWriteStream(trackInfo.metaDataPath);
        return new Promise(async (resolve, reject) => {
            await axios.get(trackInfo.metaDataLink).then(async (response: AxiosResponse) => {
                //response.data.pipe(file);
                const $ = cheerio.load(response.data);
                let metaData = this.getMetaData($);
                try {
                    fs.writeFileSync(trackInfo.metaDataPath, metaData);
                    resolve();
                } catch (err) {
                    console.log(err);
                    console.log("error writing file:", JSON.stringify(trackInfo), metaData);
                    reject();
                }

                // fs.writeFile(trackInfo.metaDataPath, this.getMetaData($), (err) => {
                //     if (err) {
                //         console.log(err);
                //         reject
                //     }
                //     resolve;
                // });
                // file.on('finish', resolve);
                // file.on('error', reject);
            }).catch(error => {
                console.log(error);
            })
        });
    }

    async run(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await axios.get(this.searchUrl(this.currentPageNum)).then(async (response: AxiosResponse) => {
                //console.log(response.data);

                const $ = cheerio.load(response.data);

                //download the first page of results and set the total pages...
                this.totalPages = this.getTotalPages($);
                let firstPageTrackLinks = this.getTrackLinksOnPage($);

                for (var i = 0; i < firstPageTrackLinks.length; i++) {
                    await this.downloadTrack(firstPageTrackLinks[i]);
                    await this.downloadMetaData(firstPageTrackLinks[i]);
                }

                if (this.currentPageNum === this.totalPages) {
                    this.currentPageNum = 1;
                } else {
                    this.currentPageNum++;
                }

                fs.writeFileSync('pageNumber.json', `{"currentPageNum": ${this.currentPageNum}}`);

                //can continue iterating and get ALL music
                // for (var i = 0; i < this.totalPages; i++) {
                //     this.currentPageNum++;
                //     await axios.get(this.searchUrl(this.currentPageNum)).then(async (res: AxiosResponse) => {
                //         const $ = cheerio.load(res.data);

                //         let trackLinks = this.getTrackLinksOnPage($);
                //         for (var i = 0; i < trackLinks.length; i++) {
                //             await this.downloadTrack(trackLinks[i]);
                //         }
                //     }).catch(error => {
                //         console.log(error);
                //     })
                // }
            }).catch(error => {
                console.log(error);
            });
        });
    }
}