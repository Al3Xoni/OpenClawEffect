export type Snowball = {
  "version": "0.1.0",
  "name": "snowball",
  "address": "6PWi6MVo7g3SkSM7wmUi341yo2EAA1WxYKYYyEiEVsxz",
  "instructions": [
    {
      "name": "initializeGame",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "pushBall",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "userSnowAccount", "isMut": true, "isSigner": false },
        { "name": "gameSnowVault", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "depositSolPot",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "resolveRound",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": false, "isSigner": true }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "gameState", 
      "type": { "kind": "struct", "fields": [
          { "name": "isActive", "type": "bool" },
          { "name": "roundNumber", "type": "u64" },
          { "name": "timerEndTimestamp", "type": "i64" },
          { "name": "snowCollected", "type": "u64" },
          { "name": "potBalanceSol", "type": "u64" },
          { "name": "lastPushers", "type": { "vec": "publicKey" } },
          { "name": "pushCount", "type": "u64" },
          { "name": "authority", "type": "publicKey" }
      ]}
    }
  ],
  "types": [
      {
        "name": "GameState",
        "type": {
          "kind": "struct",
          "fields": [
            { "name": "isActive", "type": "bool" },
            { "name": "roundNumber", "type": "u64" },
            { "name": "timerEndTimestamp", "type": "i64" },
            { "name": "snowCollected", "type": "u64" },
            { "name": "potBalanceSol", "type": "u64" },
            { "name": "lastPushers", "type": { "vec": "publicKey" } },
            { "name": "pushCount", "type": "u64" },
            { "name": "authority", "type": "publicKey" }
          ]
        }
      }
  ],
  "errors": [
    { "code": 6000, "name": "GameNotActive", "msg": "The game is not currently active." },
    { "code": 6001, "name": "RoundEnded", "msg": "The round has ended." },
    { "code": 6002, "name": "MathOverflow", "msg": "Math overflow occurred." },
    { "code": 6003, "name": "RoundStillActive", "msg": "The round is still active, cannot resolve yet." }
  ]
};

export const IDL: Snowball = {
  "version": "0.1.0",
  "name": "snowball",
  "address": "6PWi6MVo7g3SkSM7wmUi341yo2EAA1WxYKYYyEiEVsxz",
  "instructions": [
    {
      "name": "initializeGame",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "pushBall",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "userSnowAccount", "isMut": true, "isSigner": false },
        { "name": "gameSnowVault", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "depositSolPot",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "resolveRound",
      "accounts": [
        { "name": "gameState", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": false, "isSigner": true }
      ],
      "args": []
    }
  ],
  "accounts": [
     {
      "name": "gameState", 
      "type": { "kind": "struct", "fields": [
          { "name": "isActive", "type": "bool" },
          { "name": "roundNumber", "type": "u64" },
          { "name": "timerEndTimestamp", "type": "i64" },
          { "name": "snowCollected", "type": "u64" },
          { "name": "potBalanceSol", "type": "u64" },
          { "name": "lastPushers", "type": { "vec": "publicKey" } },
          { "name": "pushCount", "type": "u64" },
          { "name": "authority", "type": "publicKey" }
      ]}
    }
  ],
  "types": [
      {
        "name": "GameState",
        "type": {
          "kind": "struct",
          "fields": [
            { "name": "isActive", "type": "bool" },
            { "name": "roundNumber", "type": "u64" },
            { "name": "timerEndTimestamp", "type": "i64" },
            { "name": "snowCollected", "type": "u64" },
            { "name": "potBalanceSol", "type": "u64" },
            { "name": "lastPushers", "type": { "vec": "publicKey" } },
            { "name": "pushCount", "type": "u64" },
            { "name": "authority", "type": "publicKey" }
          ]
        }
      }
  ],
  "errors": [
    { "code": 6000, "name": "GameNotActive", "msg": "The game is not currently active." },
    { "code": 6001, "name": "RoundEnded", "msg": "The round has ended." },
    { "code": 6002, "name": "MathOverflow", "msg": "Math overflow occurred." },
    { "code": 6003, "name": "RoundStillActive", "msg": "The round is still active, cannot resolve yet." }
  ]
};
