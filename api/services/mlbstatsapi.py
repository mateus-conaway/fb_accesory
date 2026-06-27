import statsapi
import math

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
    # print(team)
    players = team["players"]
    print(players)

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

def one_percent(days):
    total = 1
    for i in range(days):
        total = total + (total * 0.01)
    return total

def min_innings(innings):
    outs = ((3*innings) + 1)
    lower_bound = math.ceil(((3*innings)+1) / 9)
    upper_bound = math.floor(((12*innings)+4) / 27)

    lower_era = (27 * lower_bound) / outs
    upper_era = (27 * upper_bound) / outs


    # if innings == 100:
    #     print(innings)
    #     return
    # else:
    #     print(f"{innings}: {upper_bound - lower_bound}")
    #     min_innings(innings+1)

    while upper_bound - lower_bound >= 3:
        print(f"{innings}: {upper_bound - lower_bound}")
        min_innings(innings+1)
    print(f"{innings}: {upper_bound - lower_bound}")
    


# example
# print(get_starting_lineup(823216, "away"))

def main():
    # print(get_starting_lineup(823216, "away"))
    # print(lineup)
    # get_roster(109)
    # get_mlb_teams()
    # schedule = statsapi.schedule(start_date='06/02/2026', end_date='06/02/2026')
    # games = []
    # for game in schedule:
    #     games.append([game['game_id'], game['home_name'], game['away_name'], game['home_probable_pitcher'], game['away_probable_pitcher']])
    # print(one_percent(2))
    min_innings(34)
    # # print(schedule)
    # print(games)
    # print(statsapi.get("team_roster", {"teamId": 109}))

if __name__ == "__main__":
    main()