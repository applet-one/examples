import { one, rows } from '../db.js';

export function findAcceptedFriendship(db, a, b) {
  return one(db, "SELECT * FROM friendships WHERE status = 'accepted' AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))", a, b, b, a);
}

export function listFriendshipsForUser(db, userId) {
  return rows(db, `SELECT f.*, a.name AS requester_name, a.email AS requester_email, b.name AS addressee_name, b.email AS addressee_email
          FROM friendships f JOIN users a ON a.id = f.requester_id JOIN users b ON b.id = f.addressee_id
          WHERE f.requester_id = ? OR f.addressee_id = ? ORDER BY f.created_at DESC`, userId, userId);
}

export function findFriendshipBetween(db, a, b) {
  return one(db, 'SELECT id FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)', a, b, b, a);
}

export function insertFriendRequest(db, id, requesterId, addresseeId, createdAt) {
  db.exec('INSERT INTO friendships VALUES (?, ?, ?, ?, ?)', id, requesterId, addresseeId, 'pending', createdAt);
}

export function findPendingFriendRequest(db, id) {
  return one(db, 'SELECT * FROM friendships WHERE id = ? AND status = ?', id, 'pending');
}

export function acceptFriendRequest(db, id) {
  db.exec("UPDATE friendships SET status = 'accepted' WHERE id = ?", id);
}

export function deleteFriendRequest(db, id) {
  db.exec('DELETE FROM friendships WHERE id = ?', id);
}
