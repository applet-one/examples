// Deliberately passwordless: names are identities for this trusted demo,
// not proof of a person's identity. Selecting Markus grants admin access.
export const ADMIN_NAME = "Markus Andrezak";

export class IdentityStorage {
  constructor(sql) {
    this.sql = sql;
    sql.exec(
      "CREATE TABLE IF NOT EXISTS collab_users (id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE)",
    );
    sql.exec(
      "CREATE TABLE IF NOT EXISTS collab_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL)",
    );
    sql.exec(
      "CREATE TABLE IF NOT EXISTS collab_revision (id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL)",
    );
    sql.exec("INSERT OR IGNORE INTO collab_revision VALUES (1, 0)");
    this.register({ firstName: "Markus", lastName: "Andrezak" });
  }
  users() {
    return this.sql
      .exec(
        "SELECT id, first_name AS firstName, last_name AS lastName FROM collab_users ORDER BY first_name, last_name",
      )
      .toArray()
      .map((user) => this.profile(user));
  }
  profile(user) {
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      isAdmin: `${user.firstName} ${user.lastName}` === ADMIN_NAME,
    };
  }
  register(input) {
    const clean = (value) =>
      typeof value === "string"
        ? value.normalize("NFC").trim().replace(/\s+/gu, " ")
        : "";
    const firstName = clean(input?.firstName),
      lastName = clean(input?.lastName);
    if (
      !firstName ||
      !lastName ||
      firstName.length > 80 ||
      lastName.length > 80 ||
      /[\p{Cc}\p{Cf}]/u.test(firstName + lastName)
    )
      throw new Error(
        "Enter a first and last name (maximum 80 characters each).",
      );
    const key = `${firstName}\n${lastName}`.toLocaleLowerCase("en-US");
    this.sql.exec(
      "INSERT OR IGNORE INTO collab_users (id, first_name, last_name, name_key) VALUES (?, ?, ?, ?)",
      crypto.randomUUID(),
      firstName,
      lastName,
      key,
    );
    const user = this.sql
      .exec(
        "SELECT id, first_name AS firstName, last_name AS lastName FROM collab_users WHERE name_key = ?",
        key,
      )
      .toArray()[0];
    return this.profile(user);
  }
  login(input) {
    const user = input?.userId
      ? this.users().find((user) => user.id === input.userId)
      : this.register(input);
    if (!user) throw new Error("Select an existing person or enter your name.");
    const token = crypto.randomUUID();
    this.sql.exec("INSERT INTO collab_sessions VALUES (?, ?)", token, user.id);
    return { user, token };
  }
  current(request) {
    const token = request.headers
      .get("cookie")
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("prioboard_session="))
      ?.slice("prioboard_session=".length);
    if (!token) return null;
    const user = this.sql
      .exec(
        "SELECT u.id, u.first_name AS firstName, u.last_name AS lastName FROM collab_users u JOIN collab_sessions s ON s.user_id = u.id WHERE s.token = ?",
        token,
      )
      .toArray()[0];
    return user ? this.profile(user) : null;
  }
  revision() {
    return this.sql
      .exec("SELECT revision FROM collab_revision WHERE id = 1")
      .toArray()[0].revision;
  }
  changed() {
    this.sql.exec(
      "UPDATE collab_revision SET revision = revision + 1 WHERE id = 1",
    );
  }
}
