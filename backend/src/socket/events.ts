export const SocketEvents = {
  hostCreateRoom: "host:create_room",
  hostStartQuiz: "host:start_quiz",
  hostNextQuestion: "host:next_question",
  hostSetMode: "host:set_mode",
  playerJoin: "player:join",
  playerAnswer: "player:answer",
  scoreboard: "quiz:scoreboard",
  question: "quiz:question",
  roomState: "quiz:room_state",
  completed: "quiz:completed"
} as const;
