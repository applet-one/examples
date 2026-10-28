// Match the CLI's explicit selection and owned-personal default; membership order
// must never decide which app is deployed. No fallback after access is removed.
export function deploymentWorkspace(me, configured) {
  const workspaces = me?.workspaces ?? [];
  if (configured !== undefined) {
    if (typeof configured !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(configured)) {
      throw Error('Invalid workspace setting in applet.jsonc.');
    }
    const selected = workspaces.find(workspace => workspace.slug === configured);
    if (!selected) throw Error(`Workspace ${configured} is inaccessible or membership was removed. No fallback was selected. Check applet.jsonc or ask the owner to restore access.`);
    return selected;
  }
  const personal = workspaces.filter(workspace => workspace.type === 'personal' && workspace.role === 'owner');
  if (personal.length !== 1) throw Error('No unambiguous owned personal Applet workspace found. Complete onboarding or set workspace explicitly in applet.jsonc.');
  return personal[0];
}
