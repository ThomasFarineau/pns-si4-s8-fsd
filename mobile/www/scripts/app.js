import session from "./modules/utils/session.js";
import modaliser from "./modules/utils/modaliser.js";
import AI from "./modules/games/ai.js";
import Local from "./modules/games/local.js";
import Online from "./modules/games/online.js";
import ezrequest from "./modules/utils/ezrequest.js";
import Viewer from "./modules/viewer.js";
import generator from "./modules/utils/generator.js";
import surprise from "../assets/medias/Surprise.js";
import navigation from "./modules/utils/navigation.js";
import friends from "./modules/utils/friends.js"
import Profile from "./modules/utils/profile.js";
import Leaderboard from "./modules/utils/leaderboard.js"
import duels from "./modules/utils/duels.js";

document.addEventListener("deviceready", () => {
    console.log("on init mobile")
    navigator.splashscreen.hide()
    init(true)
});

window.addEventListener("load", () => {
    console.log("on init pc")
    if (!window.cordova)
        init(false)
});

function init(mobile) {
    console.log("initialisation")
    console.log(mobile)
    console.log(window.cordova)
    let ip = ""
    let fs = null
    if (mobile) {
        console.log("on est un mobile")
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fileSystem) => {
            console.log('file system open: ' + fileSystem.name);
            fs = fileSystem
        }, onErrorLoadFs);
        ip = "http://15.236.216.122"
    }
    let socket = io.connect(ip + '/api/game');
    ezrequest.setUrl(ip)
    socket.on('connect', function () {

        session.check().then(() => {
            socket.emit("login", {token: session.session});
            socket.on('alreadyLogged', function () {
                let alreadyLogged = generator.createTag("alreadyLogged");
                alreadyLogged.innerHTML = "<span>" + "Vous êtes déjà en ligne sur un autre appareil / sur un autre onglet avec le même compte. Si ce n'est pas le cas, veuillez vous déconnecter et vous reconnecter." + "</span><button id='logout'>Se déconnecter</button>";
                document.body.innerHTML = "";
                document.body.appendChild(alreadyLogged);
                document.getElementById("logout").addEventListener("click", () => ezrequest.get("/api/logout").then(() => window.location.href = "/"))
            })
        }).catch(() => {
            console.warn("Your session is invalid, please login again")
        }).finally(() => {
            // set user session to socket auth token
            session.dispatcher.addEventListener("login", (e) => socket.emit("login", {token: e.detail.session}))

            let game;

            modaliser.dispatcher.addEventListener("play_local", () => {
                game = new Local()
                modaliser.close()
            })

            modaliser.dispatcher.addEventListener("play_ai", () => {
                game = new AI(socket)
                modaliser.close()
            })

            window.addEventListener("batterystatus", onBatteryStatus, false);

            let lowBattery = false;

            function onBatteryStatus(status) {
                lowBattery = status.level <= 10 && !status.isPlugged;
            }

            modaliser.dispatcher.addEventListener("play_online", () => {
                if (lowBattery) {
                    navigator.notification.confirm("Your battery is low, are you sure you want to play Online ?",
                        confirmOnline,
                        "Low battery",
                        ["Cancel", "Yes"])
                }
                else {
                    game = new Online(socket)
                }
            })

            function confirmOnline(buttonIndex) {
                //if button pressed is Yes
                if (buttonIndex === 2) {
                    game = new Online(socket)
                }
            }


            modaliser.dispatcher.addEventListener("search_player", () => {
                ezrequest.get("/api/user/profile?user=" + document.getElementById("playerName").value + "&logged=" + session.isLogged()).then((data) => {
                    modaliser.open("account", false, false, false, false).then(() => {
                        Profile.openProfile(data.response)
                    })
                })
            })

            surprise.handle()

            friends.dispatcher.addEventListener("duelSent", (user) => {
                socket.on("duelRoomCreated", (data) => {
                    console.log(data)
                    ezrequest.post("/api/friend/duelRequest", {
                        user: user.detail.userID,
                        roomID: data.roomID
                    }).then(() => console.log("duel envoyé")).catch((error) => console.log(error))
                })
                game = new Online(socket, true)
            })

            duels.dispatcher.addEventListener("acceptDuel", (user) => {
                console.log("on accepte !!!!")
                console.log(user)
                game = new Online(socket, true, user.detail.roomID)
            })

            Viewer.randomGrid("main board", "main players", "aside playing");

            modaliser.open("play", false, false, false, false).then(() => {
                friends.pollForNotifs()
                setTimeout(() => {
                    duels.pollForNotifs()
                }, 2500)
            }).catch((e) => console.log(e))

            modaliser.dispatcher.addEventListener("modal-opened", (e) => {
                if (e.detail.name === "account")
                    ezrequest.get("/api/user/profile").then((data) => Profile.openProfile(data.response));
                else if (e.detail.name === "leaderboard")
                    ezrequest.get("/api/user/leaderboard").then((data) => Leaderboard.loadLeaderboard(data.response));
                else if (e.detail.name === "friendRequests") {
                    friends.fetchfriendRequestList()
                } else if (e.detail.name === "friends") friends.fetchFriendList()
                else if (e.detail.name === "duelRequests") duels.fetchDuelsList()
            })

            modaliser.dispatcher.addEventListener("cancel_online_duel", () => {
                ezrequest.delete("/api/friend/duelRequest", {}).then(() => {
                    modaliser.open("friends")
                }).catch((e) => console.log(e))
            })

            navigation.dispatcher.addEventListener("quit", () => {
                game.reset()
                modaliser.open("play")
            })

            navigation.dispatcher.addEventListener("friends", () => {
                modaliser.open("friends", true, false, false, true)
            })

            navigation.dispatcher.addEventListener("account", () => {
                ezrequest.get("/api/user/profile").then((data) => {
                    modaliser.open("account", true, false, false, false).then(() => {
                        Profile.openProfile(data.response);
                    })
                });
            })

            let alertdisplayed = false;
            navigation.dispatcher.addEventListener("save", () => {

                if (window.cordova && !session.isLogged()) {

                    fs.root.getFile(game.type + "GameSave.txt", { create: true, exclusive: false }, (fileEntry) => {
                        console.log("fileEntry is file?" + fileEntry.isFile.toString());
                        console.log(fileEntry.name)
                        console.log(fileEntry.fullPath)
                        console.log(game.type)
                        // fileEntry.name == 'someFile.txt'
                        // fileEntry.fullPath == '/someFile.txt'
                        writeFile(fileEntry, game.save());
                    }, onErrorCreateFile);
                }
                else {
                    ezrequest.post("/api/game", game.save()).then((data) => {
                        console.log(data)
                        if(!alertdisplayed){
                            alertdisplayed = true;
                            navigator.notification.alert("",
                                () => {alertdisplayed = false},
                                "Game Saved",
                                'Done');
                        }
                    })
                }


            })

            navigation.dispatcher.addEventListener("load", () => {
                if (window.cordova && !session.isLogged()) {
                    fs.root.getFile(game.type + "GameSave.txt", { create: false, exclusive: false }, (fileEntry) => {
                        console.log("fileEntry is file?" + fileEntry.isFile.toString());
                        console.log(fileEntry.name)
                        console.log(fileEntry.fullPath)
                        // fileEntry.name == 'someFile.txt'
                        // fileEntry.fullPath == '/someFile.txt'
                        readFile(fileEntry)
                    }, onErrorRetrieveFile);
                }
                else {
                    ezrequest.get("/api/game?type=" + game.type).then((data) => {
                        let json = JSON.parse(data.response)
                        loadGame(json)
                    })
                }
            })

            function onErrorCreateFile() {
                console.log("erreur pour créer fichier");
            }

            function onErrorRetrieveFile() {
                console.log("erreur pour récupérer fichier");
            }

            function writeFile(fileEntry, dataObj) {
                // Create a FileWriter object for our FileEntry (log.txt).
                fileEntry.createWriter((fileWriter) => {

                    fileWriter.onwriteend = () => {
                        if(!alertdisplayed){
                            alertdisplayed = true;
                            navigator.notification.alert("",
                                () => {alertdisplayed = false},
                                "Game Saved",
                                'Done');
                        }
                        console.log("Successful file write...");
                        //readFile(fileEntry);
                    };

                    fileWriter.onerror = function (e) {
                        console.log("Failed file write: " + e.toString());
                    };

                    // If data object is not passed in,
                    // create a new Blob instead.
                    if (!dataObj) {
                        dataObj = new Blob(['some file data'], { type: 'text/plain' });
                    }

                    fileWriter.write(dataObj);
                });
            }

            let reader = new FileReader();

            reader.onloadend = (evt) => {
                let fileContent = JSON.parse(evt.target.result)
                console.log("Successful file read: " + fileContent);
                loadGame(fileContent)
            };

            function readFile(fileEntry) {
                fileEntry.file((file) => {
                    reader.readAsText(file);
                }, onErrorReadFile);
            }

            function onErrorReadFile() {
                console.log("erreur pour lire fichier");
            }

            function loadGame(data) {
                if (game.type === "local") {
                    let settings = JSON.parse(data.settings)
                    console.log(data.player)
                    game = new Local(settings[0], settings[1], settings[2], data.moves, null, data.player)
                    game.viewer.currentPlayer = data.player;
                    game.viewer.updatePlaying();
                } else if (game.type === "ai") {
                    game = new AI(socket, data.moves, null)
                }
            }
        })
    })
    function onErrorLoadFs() {
        console.log("erreur pour load fs");
    }
}