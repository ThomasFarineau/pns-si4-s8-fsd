class Generator {

    createTag(tag, attributes = {}, classes = []) {
        let element = document.createElement(tag);
        for (let attribute in attributes) {
            element.setAttribute(attribute, attributes[attribute]);
        }
        for (let className of classes) {
            element.classList.add(className);
        }
        return element;
    }

    createButton(text, icon) {
        let button = this.createTag("button");
        if (icon) {
            let iconE = this.createTag("icon");
            iconE.innerText = icon;
            button.append(iconE);
        }
        button.append(text);
        return button;
    }

    createInput(id, label, icon, attributes = {}) {
        // if tje input as label, then it's an input group
        if (label) {
            let group = this.createTag("input-group");
            let input = this.createTag("input", attributes);
            input.setAttribute("id", id);
            let labelE = this.createTag("label");
            labelE.setAttribute("for", id);
            if (icon) {
                let iconE = this.createTag("icon");
                iconE.innerText = icon;
                labelE.append(iconE);
            }
            labelE.append(label);
            group.append(labelE, input);
            return group;
        } else {
            let input = this.createTag("input", attributes);
            input.setAttribute("id", id);
            return input;
        }
    }

    endGameModal(data, event) {
        let endOnlineModal;
        if (data.type) {
            if (data["previous-elo"] !== undefined && data["new-elo"] !== undefined) {
                let eloDiff = data["new-elo"] - data["previous-elo"];
                // if elo diff is positive, then add a plus sign
                if (eloDiff > 0) eloDiff = "+" + eloDiff;
                endOnlineModal = {
                    "title": data.type === "draw" ? "Résultat de la partie" : "Victoire de " + (data.winner === 1 ? data.player1 : data.player2),
                    "content": [{
                        "type": "big-text",
                        "center": true,
                        "value": data.type === "winning" ? "Victoire" : data.type === "losing" ? "Défaite" : "Match nul"
                    }, {
                        "type": "image",
                        "source": data.type === "winning" ? "/api/game/gif/winner" : data.type === "losing" ? "/api/game/gif/loser" : "/api/game/gif/draw"
                    }, {
                        "type": "separator"
                    }, {
                        "type": "text", "center": true, "value": "Progression de votre ELO (" + eloDiff + "):"
                    }, {
                        "type": "big-text",
                        "center": true,
                        "value": data["previous-elo"] + " <icon>arrow_right_alt</icon> " + data["new-elo"]
                    }, {
                        "type": "separator"
                    }, {
                        "type": "flex", "content": [{
                            "type": "button", "icon": "arrow_back", "label": "Retour au menu", "action": {
                                "modal": "play"
                            }
                        }, {
                            "type": "button", "icon": "replay", "label": "Rejouer", "action": {
                                "event": event
                            }
                        }]
                    }]
                }
            } else {
                endOnlineModal = {
                    "title": data.type === "draw" ? "Résultat de la partie" : "Victoire de " + (data.winner === 1 ? data.player1 : data.player2),
                    "content": [{
                        "type": "big-text",
                        "center": true,
                        "value": data.type === "winning" ? "Victoire" : data.type === "losing" ? "Défaite" : "Match nul"
                    }, {
                        "type": "image",
                        "source": data.type === "winning" ? "/api/game/gif/winner" : data.type === "losing" ? "/api/game/gif/loser" : "/api/game/gif/draw"
                    }, {
                        "type": "separator"
                    }, {
                        "type": "flex", "content": [{
                            "type": "button", "icon": "arrow_back", "label": "Retour au menu", "action": {
                                "modal": "play"
                            }
                        }, {
                            "type": "button", "icon": "replay", "label": "Rejouer", "action": {
                                "event": event
                            }
                        }]
                    }]
                }
            }
        } else {
            endOnlineModal = {
                "title": "Résultat de la partie", "content": [{
                    "type": "big-text", "center": true, "value": "le joueur " + data.winner
                }, {
                    "type": "big-text", "center": true, "value": "gagne"
                }, {
                    "type": "image", "source": "/api/game/gif/local"
                }, {
                    "type": "separator"
                }, {
                    "type": "flex", "content": [{
                        "type": "button", "icon": "arrow_back", "label": "Retour au menu", "action": {
                            "modal": "play"
                        }
                    }, {
                        "type": "button", "icon": "replay", "label": "Rejouer", "action": {
                            "event": event
                        }
                    }]
                }]
            }
        }


        console.log(endOnlineModal)
        return endOnlineModal;

    }
}

export default new Generator();