#include "point.hpp"
#include "evaluator.hpp"

#ifndef STATUS_ENUM
#define STATUS_ENUM
enum STATUS{BLACK = 0, WHITE = 1, EMPTY = 2, BOUND = 3, ANALYZE_POINT = 4, NO_MATTER = 5};
#endif

class ChessBoard
{
public:
  static const int CHESSBOARD_DIMEN = 15;

  ChessBoard();

  /* print the current chesssboard */
  void invalidate();

  /* puts a new chess, if the ponit is not empty then return false */
  bool play(STATUS color, int row, int col);

  /* clears the whole game */
  void wipe(bool isInvalidate);

  /* get is black turn or not */
  bool isBlackTurn();

  /* search the area surrounding (row, col) for winning conditions */
  bool judge(STATUS color, int row, int col);

private:
  const char CHESS_BLACK = 'X', CHESS_WHITE = 'O';

  /* point array */
  Point* point[CHESSBOARD_DIMEN][CHESSBOARD_DIMEN];

  bool blackTurn;

  /* the total number of plays */
  int playNo;

  bool checkForbidden;

  /* print a part of the board */
  void printBoard(int row, int col, STATUS chess);
};
