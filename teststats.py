import statsapi

er = statsapi.get("game", {"gamePk": "823530"})["liveData"]["boxscore"]["teams"]["home"]['players']["ID666808"]["stats"]["pitching"]

results = statsapi.get("game", {"gamePk": "823530"})["liveData"]["plays"]["allPlays"][64]["result"]

game = statsapi.get("game", {"gamePk": "823244"})
runners = game["liveData"]["plays"]["allPlays"][12]["runners"]
for runner in runners:
    print(runner)
    print("--------------------------------")
# for runner in runners:
#     details = runner["details"]
#     print(f"{details["responsiblePitcher"]["id"]}: {details["earned"]}")




