const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbObjToResponseObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjToResponseObj = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
        *
    FROM 
        player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((player) => convertPlayerDbObjToResponseObj(player))
  );
});

//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT *
    FROM player_details
    WHERE
    player_id = ${playerId};`;
  const player = await db.get(getPlayer);
  response.send(convertPlayerDbObjToResponseObj(player));
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE 
    player_details
    SET
    player_name = '${playerName}'
    WHERE
    player_id = ${playerId};`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM
    match_details
    WHERE
    match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchObjToResponseObj(matchDetails));
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT *
    FROM player_match_score NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};`;
  const playerMatch = await db.all(getMatchesQuery);
  response.send(
    playerMatch.map((eachMatch) => convertMatchObjToResponseObj(eachMatch))
  );
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT *
    FROM player_match_score NATURAL JOIN player_details
    WHERE 
    match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((player) => convertPlayerDbObjToResponseObj(player))
  );
});

///Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
    FROM 
        player_match_score NATURAL JOIN player_details
        
    WHERE 
        player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
