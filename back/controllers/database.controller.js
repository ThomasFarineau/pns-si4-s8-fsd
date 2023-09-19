const {MongoClient} = require("mongodb");

class DatabaseController {

    constructor() {
        this.client = new MongoClient(process.env.MONGO_URL);
        this.db = this.client.db(process.env.MONGO_DB);
        this.client.connect().then(() => {
            console.log("Connected to database");
        })
        this.createUsersIndexes();
        this.createGamesIndexes();
        this.createAchievementsIndexes();
        this.createFriendsIndexes();
        this.createDuelIndexes();
    }

    createUsersIndexes() {
        this.db.collection("users").createIndex({mail: 1}, {unique: true}).then().catch((error) => console.error(`Error while creating mail index: ${error}`))
        this.db.collection("users").createIndex({username: 1}, {unique: true}).then().catch((error) => console.error(`Error while creating username index: ${error}`))
    }

    createGamesIndexes() {
        this.db.collection("games").createIndex({
            "user": 1, "type": 1
        }, {unique: true}).then().catch((error) => console.error(`Error while creating games index: ${error}`))
    }

    createAchievementsIndexes() {
        this.db.collection("achievements").createIndex({id: 1}, {unique: true}).then().catch((error) => console.error(`Error while creating achievements index: ${error}`))
        this.db.collection("achievementsUnlocked").createIndex({
            userID: 1,
            achievementID: 1
        }, {unique: true}).then().catch((error) => console.error(`Error while creating achievementsUnlocked index: ${error}`))
    }

    createFriendsIndexes() {
        this.db.collection("friends").createIndex({
            user1: 1,
            user2: 1
        }, {unique: true}).then().catch((error) => console.error(`Error while creating friends index: ${error}`))
        this.db.collection("friendRequests").createIndex({
            sender: 1,
            receiver: 1
        }, {unique: true}).then().catch((error) => console.error(`Error while creating friendRequests index: ${error}`))
    }

    createDuelIndexes(){
        //TODO créer une table "duels" contenant des couples d'id de joueurs et une ID de room associée
        this.db.collection("duelRequests").createIndex({
            sender: 1,
            receiver: 1,
        }, {unique: true}).then().catch((error) => console.error(`Error while creating duelRequests index: ${error}`))
    }

    collection(name) {
        return this.db.collection(name)
    }
}

const databaseController = new DatabaseController();
module.exports = databaseController;