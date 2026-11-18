import { $, el, add } from "../dom.js";
import { state } from "../state.js";
import { render } from "../ui.js";
import { avatar } from "./avatar.js";

async function request(options) {
  const response = await fetch("/api/profile", {
    cache: "no-store",
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Could not load profile");
  return body;
}

export function renderMembers(users) {
  const container = $("#board-members");
  container.replaceChildren();
  if (!users.length) return;
  const names = users.map((user) => user.name);
  container.setAttribute("aria-label", `Board members: ${names.join(", ")}`);
  const stack = el("span", "member-avatars");
  for (const user of users.slice(0, 3)) {
    const node = avatar(user.name, "member-avatar");
    node.title = user.name;
    add(stack, node);
  }
  if (users.length > 3) {
    const overflow = el(
      "span",
      "profile-avatar member-overflow",
      `+${users.length - 3}`,
    );
    overflow.title = names.slice(3).join(", ");
    overflow.setAttribute("aria-hidden", "true");
    add(stack, overflow);
  }
  add(
    container,
    stack,
    el("span", "small muted", `Shared with ${users.length}`),
  );
}

export function renderProfile() {
  const card = $("#profile-card");
  card.replaceChildren();
  const user = state.user;
  const info = add(
    el("span", "profile-info"),
    el("strong", "", user?.name || "Choose your name"),
    el(
      "span",
      "small muted",
      user?.isAdmin
        ? "Admin"
        : user
          ? "Member · Switch user"
          : "Join the board",
    ),
  );
  add(card, avatar(user?.name), info);
}

export async function chooseProfile() {
  const dialog = $("#profile-dialog");
  if (dialog.open) return;
  dialog.replaceChildren();
  add(
    dialog,
    el("h2", "", "Who’s joining?"),
    el(
      "p",
      "small muted",
      "Choose a person or enter your first and last name. No password needed. This is a trusted demo: selecting Markus Andrezak grants admin access.",
    ),
  );
  const status = el("p", "small", "Loading people…");
  status.setAttribute("role", "status");
  add(dialog, status);
  dialog.showModal();
  let users;
  try {
    users = (await request()).users;
    renderMembers(users);
  } catch (error) {
    status.textContent = error.message;
    const retry = el("button", "", "Retry");
    retry.onclick = () => {
      dialog.close();
      chooseProfile();
    };
    add(dialog, retry);
    return;
  }
  status.textContent = "";
  const form = el("form", "profile-form");
  const select = el("select");
  select.id = "profile-person";
  add(select, el("option", "", "Enter a new name…"));
  select.firstChild.value = "";
  for (const user of users) {
    const option = el(
      "option",
      "",
      user.name + (user.isAdmin ? " · Admin" : ""),
    );
    option.value = user.id;
    add(select, option);
  }
  const label = el("label", "", "Select a person");
  label.htmlFor = select.id;
  const fields = el("div", "profile-fields");
  for (const [id, text, autocomplete] of [
    ["profile-first", "First name", "given-name"],
    ["profile-last", "Last name", "family-name"],
  ]) {
    const label = el("label", "", text);
    label.htmlFor = id;
    const input = el("input");
    input.id = id;
    input.maxLength = 80;
    input.required = true;
    input.autocomplete = autocomplete;
    add(fields, label, input);
  }
  select.onchange = () => {
    fields.hidden = !!select.value;
    fields
      .querySelectorAll("input")
      .forEach((input) => (input.disabled = !!select.value));
  };
  const submit = el("button", "primary", "Join board");
  submit.type = "submit";
  form.onsubmit = async (event) => {
    event.preventDefault();
    submit.disabled = true;
    status.textContent = "Joining…";
    try {
      const input = select.value
        ? { userId: select.value }
        : {
            firstName: $("#profile-first").value,
            lastName: $("#profile-last").value,
          };
      state.user = (
        await request({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        })
      ).user;
      renderMembers((await request()).users);
      dialog.close();
      render();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  };
  add(form, label, select, fields, submit);
  if (state.user) {
    const cancel = el("button", "", "Cancel");
    cancel.type = "button";
    cancel.onclick = () => dialog.close();
    add(form, cancel);
  }
  add(dialog, form);
  select.focus();
}

export async function initProfile() {
  $("#profile-card").onclick = chooseProfile;
  $("#profile-dialog").addEventListener("cancel", (event) => {
    if (!state.user) event.preventDefault();
  });
  try {
    const profile = await request();
    state.user = profile.user;
    renderMembers(profile.users);
  } catch {
    /* The chooser offers retry. */
  }
  renderProfile();
  if (!state.user) await chooseProfile();
}
