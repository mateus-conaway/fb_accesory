import statsapi

er = statsapi.get("game", {"gamePk": "823530"})["liveData"]["boxscore"]["teams"]["home"]['players']["ID666808"]["stats"]["pitching"]

results = statsapi.get("game", {"gamePk": "823530"})["liveData"]["plays"]["allPlays"][64]["result"]

game = statsapi.get("game", {"gamePk": "823530"})
play = game["liveData"]["plays"]["allPlays"][64]



