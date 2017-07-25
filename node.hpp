#ifndef GAME_TREE_NODE_H
#define GAME_TREE_NODE_H

#include <stdint.h>

#include <map>

class GameTree::Node {
 public:
  // consturctor for root
  Node();
  // constructor for node (EXCEPT root node)
  Node(Node *parentNode, int index, int parentWinOrLose);

  // overload new and delete for memory pool
  // under normal circumstances, all nodes will all nodes will be deleted when restart the game
  // so the action of release memory will be processed in memory pool
  static void *operator new(size_t size) { return pool.allocate(size); }
  static void operator delete(void *ptr, size_t size) { }

  // update when tie
  void update() { ++playout_[2]; }
  // update, result: 0 -> win, 1 -> lose
  void update(bool result) { ++playout_[2]; ++playout_[result]; }

  // MCTS function, call by GameTree::selection
  // select child according to UCBValue and point's score
  // return -2 if select to leaf and no result yet, 0 for losing, 1 for winning, -1 if chessboard is full
  // FIX: discription of return value not complete.
  int selection(int* index, VirtualBoard* board);

  // get winRate
  // NOTE: the win rate is for the upper layer(parent node)
  double winRate() const {
    return ((playout_[0] + (playout_[2] - playout_[0] - playout_[1]) / 2.0) / (double)playout_[2]);
  }

  // getter
  int totalPlayout() const { return playout_[2]; }
  int index() const { return index_; }
  Node* parent() const { return parent_; }
  bool winning() const { return winning_; }
  bool losing() const { return losing_; }

  // set all playout to 0
  void clearPlayout() { playout_[0] = 0; playout_[1] = 0; playout_[2] = 0; }

  // set win/lose to false
  void clearWinLose() { winning_ = false; losing_ = false; }

  // get child node with specify index
  Node* child(int index) const;

  // append a new child and return it, parameters for node's constructor
  Node* newChild(int index, int parentWinOrLose);

  // custom iterator, iterates over node's child
  // Usage: for (Node* child : *node)
  class Iterator {
   public:
    Iterator(Node* node) :node_(node) {}

    bool operator!=(const Iterator& iter) const { return node_ != NULL; };

    Node* operator*() const { return node_; };

    const Iterator& operator++() { node_ = node_->next_; };
   private:
    Node* node_;
  };

  Iterator begin() const { return Iterator(child_); }

  Iterator end() const { return Iterator(NULL); }

 private:
  // get the Upper Confidence Bound value form child node
  double getUCBValue(const Node* node) const;

  // parent, child, next node
  Node *parent_, *child_, *next_;

  // 0 = win, 1 = lose, 2 = total
  int playout_[3];

  int16_t index_;

  // represent is current player winning or losing
  bool winning_, losing_;
};

#endif
