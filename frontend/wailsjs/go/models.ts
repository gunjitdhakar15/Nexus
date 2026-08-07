export namespace models {
	
	export class AltAccount {
	    id: string;
	    gameId: string;
	    name: string;
	    level: number;
	    playtimeHours: number;
	    lastPlayed: string;
	    progress: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new AltAccount(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.gameId = source["gameId"];
	        this.name = source["name"];
	        this.level = source["level"];
	        this.playtimeHours = source["playtimeHours"];
	        this.lastPlayed = source["lastPlayed"];
	        this.progress = source["progress"];
	    }
	}
	export class Game {
	    id: string;
	    title: string;
	    coverArt: string;
	    totalPlaytime: number;
	    metacritic: number;
	    rating: number;
	    released: string;
	    genres: string;
	    rawgId: number;
	    steamAppId: number;
	
	    static createFrom(source: any = {}) {
	        return new Game(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.coverArt = source["coverArt"];
	        this.totalPlaytime = source["totalPlaytime"];
	        this.metacritic = source["metacritic"];
	        this.rating = source["rating"];
	        this.released = source["released"];
	        this.genres = source["genres"];
	        this.rawgId = source["rawgId"];
	        this.steamAppId = source["steamAppId"];
	    }
	}
	export class GameDetails {
	    title: string;
	    coverUrl: string;
	    rating: number;
	    metacritic: number;
	    released: string;
	    genres: string[];
	    rawgId: number;
	
	    static createFrom(source: any = {}) {
	        return new GameDetails(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.coverUrl = source["coverUrl"];
	        this.rating = source["rating"];
	        this.metacritic = source["metacritic"];
	        this.released = source["released"];
	        this.genres = source["genres"];
	        this.rawgId = source["rawgId"];
	    }
	}
	export class SteamGame {
	    appId: number;
	    title: string;
	    playtimeHours: number;
	    coverUrl: string;
	    headerUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new SteamGame(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.appId = source["appId"];
	        this.title = source["title"];
	        this.playtimeHours = source["playtimeHours"];
	        this.coverUrl = source["coverUrl"];
	        this.headerUrl = source["headerUrl"];
	    }
	}

}

