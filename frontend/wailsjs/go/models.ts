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
	
	    static createFrom(source: any = {}) {
	        return new Game(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.coverArt = source["coverArt"];
	        this.totalPlaytime = source["totalPlaytime"];
	    }
	}

}

