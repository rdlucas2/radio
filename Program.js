"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new(P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
  
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
  
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __importDefault = (this && this.__importDefault) || function(mod) {
  return (mod && mod.__esModule) ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Program = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const fs_1 = __importDefault(require("fs"));
const pageNumber_json_1 = __importDefault(require("./pageNumber.json"));
const config_json_1 = __importDefault(require("./config.json"));

class Program {
  constructor() {
    this.currentPageNum = pageNumber_json_1.default.currentPageNum;
    this.maxTracksPerPage = 10;
    this.downloadPath = config_json_1.default.mediaPath;
    this.searchUrl = (pageNum) => {
      return `https://www.free-stock-music.com/search.php?cat=&mood=&bpm=&length=&license=6&keyword=&p=${pageNum}`;
    };
    this.getTotalPages = ($) => {
      let totalTracks = parseInt($('.tracksNumberCont').text().split('of ')[1]);
      return Math.ceil(totalTracks / this.maxTracksPerPage);
    };
    this.getTrackLinksOnPage = ($) => {
      let tracks = [];
      $('.downloadSingle').each((i, elem) => {
        let trackPage = $(elem).attr('href');
        let simpleName = trackPage.replace('.html', '');
        let trackName = simpleName + '.mp3';
        let metaDataName = simpleName + '.txt';
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
    };
    this.getMetaData = ($) => {
      return $('.front-label').first().find('b').last().text();
    };
    this.downloadTrack = (trackInfo) => __awaiter(this, void 0, void 0, function*() {
      const file = fs_1.default.createWriteStream(trackInfo.path);
      return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function*() {
        yield axios_1.default.get(trackInfo.link, {
          response.data.pipe(file);
          file.on('finish', resolve);
          file.on('error', reject);
        })).catch(error => {
          console.log(error);
        });
      }));
    });
    this.downloadMetaData = (trackInfo) => __awaiter(this, void 0, void 0, function*() {
      return new Promise((resolve, reject) => (this, void 0, void 0, function*() {
        yield axios_1.default.get(trackInfo.metaDataLink).then((response) => __awaiter(this, void 0, void 0, function*() {
          const $ = cheerio_1.default.load(response.data);
          let metaData = this.getMetaData($);
          try {
            fs_1.default.writeFileSync(trackInfo.metaDataPath, metaData);
            resolve();
          } catch (err) {
            console.log(err);
            console.log("error writing file:", JSON.stringify(trackInfo), metaData);
            reject();
          }
        })).catch(error => {
          console.log(error);
        });
      }));
    });
  }
  run() {
    return __awaiter(this, void 0, void 0, function*() {
      return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function*() {
        yield axios_1.default.get((this.searchUrl(this.currentPageNum)).then((response) => __awaiter(this, void 0, void 0, function*() {
          const $ = cheerio_1.default.load(response.data);
          this.totalPages = this.getTotalPages($);
          let firstPageTrackLinks = this.getTrackLinksOnPage($);
          for (var i = 0; i < firstPageTrackLinks.length; i++) {
            yield this.downloadTrack(firstPageTrackLinks[i]);
            yield this.downloadMetaData(firstPageTrackLinks[i]);
          }
          if (this.currentPageNum === this.totalPages) {
            this.currentPageNum = 1;
          } else {
            this.currentPageNum++;
          }
          fs_1.default.writeFileSync('pageNumber.json', `{"currentPageNum": ${this.currentPageNum}}`);
        })).catch(error => {
          console.log(error);
        });
      }));
    });
  }
}
exports.Program = Program;
