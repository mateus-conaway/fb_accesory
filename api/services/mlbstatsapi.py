import statsapi

# schedule = statsapi.schedule(start_date='05/27/2026', end_date='05/27/2026')
lineup = statsapi.get("game", {"gamePk": 823216})['liveData']['boxscore']['teams']['away']['players']

def get_roster(team_id: int):
    roster = statsapi.get("team_roster", {"teamId": team_id})
    # print(roster['roster'])
    for player in roster['roster']:
        id = player['person']['id']
        team = player['parentTeamId']
        print(f"{id} {str(team)}")


def get_starting_lineup(game_pk: int, side: str = "away"):
    game = statsapi.get("game", {"gamePk": game_pk})
    team = game["liveData"]["boxscore"]["teams"][side]
    players = team["players"]

    starters = []
    for p in players.values():
        batter_order = p.get("battingOrder")
        if batter_order and batter_order.endswith("00"):  # starter in that batting slot
            starters.append({
                "player_id": p["person"]["id"],
                "name": p["person"]["fullName"],
                "batting_order": batter_order,
            })

    starters.sort(key=lambda x: int(x["batting_order"]))
    for starter in starters:
        print(starter.get("player_id"))

def get_mlb_teams():
    teams = statsapi.get("teams")['teams']
    # print(teams)
    for team in teams:
        if team['sport']['name'] == 'Major League Baseball':
            print(team['id'], team['name'])


# example
# print(get_starting_lineup(823216, "away"))

def main():
    # print(get_starting_lineup(823216, "away"))
    # print(lineup)
    # get_roster(109)
    print(statsapi.get("team", {"teamId": 109}))
    # get_mlb_teams()
    # print(statsapi.get("team_roster", {"teamId": 109}))

if __name__ == "__main__":
    main()